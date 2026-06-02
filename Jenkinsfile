pipeline {
    agent any

    environment {
        BACKEND_IMAGE = 'leave-backend:latest'
        FRONTEND_IMAGE = 'leave-frontend:latest'
        AI_IMAGE = 'leave-ai:latest'
        KUBECONFIG = 'C:\\Users\\Payal\\.kube\\config'
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
                        bat "minikube image build -t %BACKEND_IMAGE% .\\backend"
                    }
                }
                stage('Frontend') {
                    steps {
                        bat "minikube image build -t %FRONTEND_IMAGE% .\\frontend"
                    }
                }
                stage('AI') {
                    steps {
                        bat "minikube image build -t %AI_IMAGE% .\\ai-service"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                bat '''
                    kubectl config use-context minikube
                    kubectl apply -f k8s/
                    kubectl rollout status deployment/leave-backend
                    kubectl rollout status deployment/leave-frontend
                    kubectl rollout status deployment/leave-ai
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
