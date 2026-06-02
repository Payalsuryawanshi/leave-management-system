pipeline {
    agent any

    environment {
        BACKEND_IMAGE = 'leave-backend:latest'
        FRONTEND_IMAGE = 'leave-frontend:latest'
        AI_IMAGE = 'leave-ai:latest'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Payalsuryawanshi/leave-management-system.git'
            }
        }

        stage('Build Images') {
            parallel {
                stage('Backend') {
                    steps {
                        bat "docker build -t %BACKEND_IMAGE% .\\backend"
                    }
                }
                stage('Frontend') {
                    steps {
                        bat "docker build -t %FRONTEND_IMAGE% .\\frontend"
                    }
                }
                stage('AI') {
                    steps {
                        bat "docker build -t %AI_IMAGE% .\\ai-service"
                    }
                }
            }
        }

        stage('Deploy Backend') {
            when {
                branch 'main'
            }
            steps {
                bat '''
                    kubectl apply -f k8s/deployment.yaml
                    kubectl apply -f k8s/service.yaml
                    kubectl rollout status deployment/leave-backend
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
