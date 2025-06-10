/* Jenkinsfile – FitMap - Updated Version */

pipeline {
    agent any

    environment {
        NODE_IMAGE = 'node:18-alpine'
        COMPOSE_FILE = '../docker-compose.yml'
        DOCKERFILE_PATH = '../Dockerfile'
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
                    script {
                        echo "✅ Tests completed successfully"
                        def tr = currentBuild.testResultAction
                        if (tr) {
                            def total  = tr.totalCount ?: 0
                            def passed = tr.passCount  ?: 0
                            def failed = tr.failCount ?: 0
                            def skipped = tr.skipCount ?: 0
                            def ratio  = total ? passed / total : 0
                            
                            echo "🧪 Test Results:"
                            echo "   Total: ${total}"
                            echo "   Passed: ${passed}"
                            echo "   Failed: ${failed}"
                            echo "   Skipped: ${skipped}"
                            echo "   Pass Rate: ${(ratio*100).round(2)}%"

                            if (ratio < 0.90) {
                                error "❌ Pass rate ${(ratio*100).round(2)}% is below required 90% threshold"
                            }
                        } else {
                            echo "⚠️  No test results available for quality gate check"
                        }
                    }
                }
                failure {
                    echo "❌ Tests failed - check the test output above"
                }
            }
        }

        /* ---------- Build ---------- */
        stage('Build Docker Image') {
            when {
                expression { 
                    // Only run if tests passed
                    return currentBuild.currentResult == 'SUCCESS'
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
                    return currentBuild.currentResult == 'SUCCESS'
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
                    return currentBuild.currentResult == 'SUCCESS'
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
                
                dir('fitmap') {
                    // Always try to clean up containers
                    if (fileExists(env.COMPOSE_FILE)) {
                        bat "docker-compose -f ${env.COMPOSE_FILE} down --remove-orphans || echo 'Cleanup completed with warnings'"
                    } else {
                        echo "⚠️  docker-compose.yml not found, skipping container cleanup"
                    }
                }
                
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
                
                // Try to dump logs for debugging
                dir('fitmap') {
                    if (fileExists(env.COMPOSE_FILE)) {
                        echo "📋 Dumping container logs for debugging:"
                        bat "docker-compose -f ${env.COMPOSE_FILE} logs --tail=50 || echo 'Could not retrieve logs'"
                    }
                }
                
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
            echo '🛑 Pipeline was aborted'
            // Still try to cleanup
            dir('fitmap') {
                if (fileExists(env.COMPOSE_FILE)) {
                    bat "docker-compose -f ${env.COMPOSE_FILE} down --remove-orphans || echo 'Cleanup after abort completed'"
                }
            }
        }
    }
}
