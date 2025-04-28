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

        stage('Setup Node.js') {
            steps {
                bat 'node --version'
                bat 'npm --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('fitmap') {
                    bat 'npm install'
                }
            }
        }

        stage('Run Tests') {
            steps {
                dir('fitmap') {
                    bat 'npm test -- --passWithNoTests'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                dir('fitmap') {
                    // build context is fitmap/, Dockerfile is one level up
                    bat 'docker build -t fitmap-app --no-cache -f ../Dockerfile .'
                }
            }
        }

        stage('Run Docker Container') {
            steps {
                dir('fitmap') {
                    // bring up containers
                    bat 'docker-compose -f ../docker-compose.yml up -d'
                    // wait without stdin issues
                    bat 'powershell -Command "Start-Sleep -Seconds 10"'
                    // list running containers
                    bat 'docker-compose -f ../docker-compose.yml ps'
                }
            }
        }
    }

    post {
        always {
            // teardown and clean
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
