/* Jenkinsfile – FitMap */

pipeline {
    agent any

    environment {
        NODE_IMAGE = 'node:18-alpine'
    }

    stages {

        /* ---------- Source ---------- */
        stage('Checkout') {
            steps { checkout scm }
        }

        /* ---------- Tooling ---------- */
        stage('Setup Node.js (host)') {
            steps {
                bat 'node --version'
                bat 'npm --version'
            }
        }

        /* ---------- Dependencies ---------- */
        stage('Install Dependencies') {
            steps {
                dir('fitmap') { bat 'npm ci' }
            }
        }

        /* ---------- Tests & Quality Gate ---------- */
        stage('Run Tests (Docker + JUnit)') {
            steps {
                dir('fitmap') {
                    /* pull image if missing */
                    bat "docker pull %NODE_IMAGE%"

                    /* run Jest; mark build UNSTABLE if any test fails */
                    catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                        bat """
                        docker run --rm ^
                          -e CI=true ^
                          -e JEST_JUNIT_OUTPUT=/app/fitmap/junit.xml ^  /* write report into fitmap dir */
                          -v "%cd%":/app ^
                          -w /app ^
                          %NODE_IMAGE% ^
                          sh -c "npm run test:ci"
                        """
                    }
                }
            }
            post {
                /* always try to archive the XML that Jest-JUnit produced */
                always { junit testResults: 'fitmap/junit.xml', allowEmptyResults: true }

                /* simple quality‐gate: mark build UNSTABLE if pass-rate < 90 % */
                always {
                    script {
                        def tr = currentBuild.testResultAction
                        if (tr) {
                            def ratio = tr.totalCount ? tr.passCount / tr.totalCount : 1
                            echo "🧪  Pass-rate = ${(ratio*100).round(2)} %"
                            if (ratio < 0.90) {
                                currentBuild.result = 'UNSTABLE'
                                echo "⚠️  Pass-rate below 90 % – build is UNSTABLE."
                            }
                        }
                    }
                }
            }
        }

        /* ---------- Build ---------- */
        stage('Build Docker Image') {
            steps {
                dir('fitmap') {
                    bat 'docker build -t fitmap-app --no-cache -f ../Dockerfile .'
                }
            }
        }

        /* ---------- Run ---------- */
        stage('Run Docker Container') {
            steps {
                dir('fitmap') {
                    bat 'docker-compose -f ../docker-compose.yml up -d'
                    bat 'powershell -Command "Start-Sleep -Seconds 10"'
                    bat 'docker-compose -f ../docker-compose.yml ps'
                }
            }
        }
    }

    /* ---------- Cleanup & Notifications ---------- */
    post {
        /* Stop containers first, **then** wipe workspace */
        always {
            dir('fitmap') {
                catchError(buildResult: 'SUCCESS', stageResult: 'SUCCESS') {
                    bat 'docker-compose -f ../docker-compose.yml down'
                    bat 'docker-compose -f ../docker-compose.yml logs || exit 0'
                }
            }
            cleanWs()
        }
        success  { echo '✅  Pipeline completed successfully!' }
        unstable { echo '🟡  Pipeline finished UNSTABLE (test failures).' }
        failure  { echo '❌  Pipeline failed (infrastructure error).' }
    }
}
