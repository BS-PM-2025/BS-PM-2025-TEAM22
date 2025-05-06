pipeline {
    agent any

    environment {
        NODE_IMAGE = 'node:18-alpine'   // image קיים ב-Docker Hub
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

        /* ---------- Tests & JUnit ---------- */
        stage('Run Tests (Docker + JUnit)') {
            steps {
                dir('fitmap') {
                    /* מושך Image אם לא קיים */
                    bat "docker pull %NODE_IMAGE%"

                    /* מריץ את הבדיקות + jest-junit */
                    bat """
                    docker run --rm ^
                      -e CI=true ^
                      -v "%cd%":/app ^
                      -w /app ^
                      %NODE_IMAGE% ^
                      npm run test:ci
                    """
                }
            }
            post {
                always {
                    /* מפרסם junit.xml → Jenkins Test Results */
                    junit testResults: 'fitmap/junit.xml',
                          allowEmptyResults: true
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
        always {
            dir('fitmap') { bat 'docker-compose -f ../docker-compose.yml down' }
            cleanWs()
        }
        success { echo '✅  Pipeline completed successfully!' }
        failure {
            echo '❌  Pipeline failed, dumping logs:'
            dir('fitmap') { bat 'docker-compose -f ../docker-compose.yml logs' }
        }
    }
}
