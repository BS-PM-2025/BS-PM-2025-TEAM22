pipeline {
    agent any

    environment {
        NODE_VERSION = '18.x'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup Node.js (host)') {
            steps {
                bat 'node --version'
                bat 'npm --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('fitmap') {
                    bat 'npm ci'
                }
            }
        }

        stage('Run Tests in Docker') {
            steps {
                dir('fitmap') {
                    // Run in CI mode, disable watch, passWithNoTests
                    bat """
                    docker run --rm ^
                      -e CI=true ^
                      -v "%cd%":/app ^
                      -w /app ^
                      node:18 ^
                      npm test -- --passWithNoTests --watchAll=false
                    """
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                dir('fitmap') {
                    bat 'docker build -t fitmap-app --no-cache -f ../Dockerfile .'
                }
            }
        }

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

    post {
        always {
            dir('fitmap') {
                bat 'docker-compose -f ../docker-compose.yml down'
            }
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed, dumping logs:'
            dir('fitmap') {
                bat 'docker-compose -f ../docker-compose.yml logs'
            }
        }
    }
}
