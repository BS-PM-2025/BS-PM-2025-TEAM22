pipeline {
    agent any

    environment {
        NODE_VERSION = '18.x'
    }

    stages {
        /* ---------- Source ---------- */
        stage('Checkout') {
            steps {
                checkout scm
            }
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
                dir('fitmap') {
                    bat 'npm ci'
                }
            }
        }

        /* ---------- Tests & JUnit ---------- */
        stage('Run Tests (Docker + JUnit)') {
            steps {
                dir('fitmap') {
                    bat """
                    docker run --rm ^
                      -e CI=true ^
                      -v "%cd%":/app ^
                      -w /app ^
                      node:%NODE_VERSION% ^
                      npm run test:ci
                    """
                }
            }
            /* פרסום תוצאות הבדיקות כדי לקבל את אחוז ההצלחה */
            post {
                always {
                    // XML נוצר ע"י jest-junit → fitmap/junit.xml
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
            dir('fitmap') {
                bat 'docker-compose -f ../docker-compose.yml down'
            }
            cleanWs()
        }
        success {
            echo '✅  Pipeline completed successfully!'
        }
        failure {
            echo '❌  Pipeline failed, dumping logs:'
            dir('fitmap') {
                bat 'docker-compose -f ../docker-compose.yml logs'
            }
        }
    }
}
