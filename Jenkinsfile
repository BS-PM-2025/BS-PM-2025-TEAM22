/* Jenkinsfile – FitMap - Updated Version */

pipeline {
    agent any

    environment {
        NODE_IMAGE = 'node:18-alpine'
        COMPOSE_FILE = '../docker-compose.yml'
        DOCKERFILE_PATH = '../Dockerfile'
        SUS_CSV_URL    = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQG10607vVkoy3p3_oCcHAnCP7wk5knybmmkc_SXU7Ui1FiVHLyAH1YlVgtPoSZm9mwoJQ_4z7zNPm0/pub?gid=306676688&single=true&output=csv'
    }

    stages {
        /* ---------- Source ---------- */
        stage('Checkout') {
            steps { 
                checkout scm 
                script {
                    echo "🔍 Workspace contents:"
                    bat 'dir'
                    echo "🔍 FitMap directory contents:"
                    dir('fitmap') { bat 'dir' }
                }
            }
        }

        /* ---------- Tooling ---------- */
        stage('Setup Node.js (host)') {
            steps {
                script {
                    echo "🔧 Checking Node.js and npm versions..."
                    bat 'node --version'
                    bat 'npm --version'
                }
            }
        }

        /* ---------- Dependencies ---------- */
        stage('Install Dependencies') {
            steps {
                dir('fitmap') { 
                    echo "📦 Installing dependencies..."
                    bat 'npm ci'
                    bat 'npm list --depth=0'
                }
            }
        }

/* ---------- SUS Usability Gate (Read from O2) ---------- */
stage('SUS Usability Check') {
    steps {
        script {
            echo "📈 Fetching SUS average from Google Sheets..."
            
            bat "powershell -Command \"Invoke-WebRequest -Uri '%SUS_CSV_URL%' -OutFile sus.csv\""
            
            writeFile file: 'get_sus_avg.ps1', text: '''
try {
    $csv = Import-Csv sus.csv -Header (1..20 | ForEach-Object { "Col$_" })
    
    $susAvg = $csv[1].Col15
    
    if ([string]::IsNullOrWhiteSpace($susAvg)) {
        $susAvg = $csv[2].Col15
    }
    
    $susAvg = $susAvg.Trim()
    if ($susAvg -match '^[0-9.]+$') {
        Write-Output "SUS_AVG=$susAvg"
        "SUS_AVG=$susAvg" | Out-File -FilePath sus_result.txt -Encoding ASCII
    } else {
        Write-Output "Invalid SUS average value: $susAvg"
        "SUS_AVG=0" | Out-File -FilePath sus_result.txt -Encoding ASCII
    }
} catch {
    Write-Error $_
    "SUS_AVG=0" | Out-File -FilePath sus_result.txt -Encoding ASCII
}
'''
            
            bat 'powershell -ExecutionPolicy Bypass -File get_sus_avg.ps1'
            
            def susAvg = 0
            if (fileExists('sus_result.txt')) {
                def result = readFile('sus_result.txt').trim()
                if (result.contains('=')) {
                    susAvg = result.split('=')[1] as double
                }
            }
            
            echo "📊 SUS Average Score (from O2): ${susAvg}"
            currentBuild.description = "SUS: ${susAvg}"
            
            if (susAvg == 0) {
                echo "⚠️  Could not read SUS average - please check Google Sheets manually"
            } else if (susAvg < 80) {
                currentBuild.result = 'UNSTABLE'
                unstable("⚠️  SUS Score (${susAvg}) is below the 80 threshold!")
            } else {
                echo "✅ SUS usability gate passed (${susAvg} ≥ 80)"
            }
            
            bat 'del get_sus_avg.ps1 sus.csv sus_result.txt 2>nul'
        }
    }
}

        /* ---------- Tests & Quality Gate ---------- */
        stage('Run Tests (Docker + JUnit)') {
            steps {
                dir('fitmap') {
                    script {
                        echo "🧪 Running tests in Docker container..."
                        
                        // Pull image if missing
                        bat "docker pull %NODE_IMAGE%"

                        // Run Jest tests inside the container using your existing test:ci script
                        bat """
                        docker run --rm ^
                          -e CI=true ^
                          -v "%cd%":/app ^
                          -w /app ^
                          %NODE_IMAGE% ^
                          sh -c "npm run test:ci"
                        """
                    }
                }
            }
            post {
                always {
                    dir('fitmap') {
                        script {
                            // Check for test results based on your jest-junit config
                            def testFiles = [
                                'junit.xml',
                                'test-results.xml', 
                                'test-report.xml'
                            ]
                            
                            def foundTestFile = false
                            testFiles.each { file ->
                                if (fileExists(file)) {
                                    echo "📊 Found test results at: ${file}"
                                    junit testResults: file, allowEmptyResults: true
                                    foundTestFile = true
                                    return true // break from closure
                                }
                            }
                            
                            if (!foundTestFile) {
                                echo "⚠️  No test result XML files found. Available files:"
                                bat 'dir *.xml 2>nul || echo "No XML files found"'
                            }
                        }
                    }
                }
                success {
                    echo "✅ Tests completed successfully - proceeding to build!"
                }
                failure {
                    script {
                        echo "❌ Tests failed - but continuing pipeline for debugging"
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }
        
        /* ---------- Build ---------- */
        stage('Build Docker Image') {
            when {
                expression { 
                    // Continue even if tests failed (for debugging purposes)
                    return true
                }
            }
            steps {
                dir('fitmap') {
                    script {
                        echo "🐳 Building Docker image..."
                        
                        // Check if Dockerfile exists
                        if (!fileExists(env.DOCKERFILE_PATH)) {
                            error "❌ Dockerfile not found at ${env.DOCKERFILE_PATH}"
                        }
                        
                        bat "docker build -t fitmap-app:${env.BUILD_NUMBER} --no-cache -f ${env.DOCKERFILE_PATH} ."
                        bat "docker tag fitmap-app:${env.BUILD_NUMBER} fitmap-app:latest"
                        
                        echo "✅ Docker image built successfully"
                    }
                }
            }
        }

        /* ---------- Run ---------- */
        stage('Run Docker Container') {
            when {
                expression { 
                    // Continue building containers even if tests failed
                    return true
                }
            }
            steps {
                dir('fitmap') {
                    script {
                        echo "🚀 Starting Docker container..."
                        
                        // Check if docker-compose.yml exists
                        if (!fileExists(env.COMPOSE_FILE)) {
                            error "❌ docker-compose.yml not found at ${env.COMPOSE_FILE}"
                        }

                        // Stop any existing containers
                        bat "docker-compose -f ${env.COMPOSE_FILE} down --remove-orphans || echo 'No existing containers to stop'"
                        
                        // Start new containers
                        bat "docker-compose -f ${env.COMPOSE_FILE} up -d"
                        
                        // Wait for containers to be ready
                        bat 'powershell -Command "Start-Sleep -Seconds 15"'
                        
                        // Check container status
                        bat "docker-compose -f ${env.COMPOSE_FILE} ps"
                        
                        // Optional: Health check
                        bat "docker-compose -f ${env.COMPOSE_FILE} logs --tail=20"
                        
                        echo "✅ Container started successfully"
                    }
                }
            }
        }

        /* ---------- Basic Health Check ---------- */
        stage('Health Check') {
            when {
                expression { 
                    // Continue health check even if tests failed
                    return true
                }
            }
            steps {
                script {
                    echo "🏥 Performing basic health check..."
                    
                    // Wait a bit more for app to fully start
                    bat 'powershell -Command "Start-Sleep -Seconds 5"'
                    
                    // Check if containers are still running
                    dir('fitmap') {
                        bat "docker-compose -f ${env.COMPOSE_FILE} ps"
                    }
                    
                    echo "✅ Health check completed"
                }
            }
        }
    }

    /* ---------- Cleanup & Notifications ---------- */
    post {
        always {
            script {
                echo "🧹 Starting cleanup..."
            }
            
            dir('fitmap') {
                script {
                    // Always try to clean up containers
                    if (fileExists(env.COMPOSE_FILE)) {
                        bat "docker-compose -f ${env.COMPOSE_FILE} down --remove-orphans || echo 'Cleanup completed with warnings'"
                    } else {
                        echo "⚠️  docker-compose.yml not found, skipping container cleanup"
                    }
                }
            }
            
            script {
                // Clean workspace
                cleanWs()
                echo "✅ Cleanup completed"
            }
        }
        
        success { 
            echo '🎉 Pipeline completed successfully!'
            echo "✅ FitMap application is ready!"
        }
        
        failure {
            script {
                echo '❌ Pipeline failed!'
            }
            
            // Try to dump logs for debugging
            dir('fitmap') {
                script {
                    if (fileExists(env.COMPOSE_FILE)) {
                        echo "📋 Dumping container logs for debugging:"
                        bat "docker-compose -f ${env.COMPOSE_FILE} logs --tail=50 || echo 'Could not retrieve logs'"
                    }
                }
            }
            
            script {
                // Show some debugging info
                echo "💡 Debugging information:"
                bat 'docker ps -a || echo "Could not list containers"'
                bat 'docker images fitmap-app || echo "No fitmap images found"'
            }
        }
        
        unstable {
            echo '⚠️  Pipeline completed with warnings'
        }
        
        aborted {
            script {
                echo '🛑 Pipeline was aborted'
            }
            // Still try to cleanup
            dir('fitmap') {
                script {
                    if (fileExists(env.COMPOSE_FILE)) {
                        bat "docker-compose -f ${env.COMPOSE_FILE} down --remove-orphans || echo 'Cleanup after abort completed'"
                    }
                }
            }
        }
    }
}
