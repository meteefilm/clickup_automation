pipeline {
    agent any

    environment {
        APP_NAME = 'clickup-automation'
        CONTAINER_NAME = 'clickup-automation'
        IMAGE_NAME = 'clickup-automation:latest'
        APP_PORT = '3000'
        HOST_PORT = '3000'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://your-git-repo-url.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build TypeScript') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t ${IMAGE_NAME} .'
            }
        }

        stage('Stop Old Container') {
            steps {
                sh '''
                    docker rm -f ${CONTAINER_NAME} || true
                '''
            }
        }

        stage('Run New Container') {
            steps {
                sh '''
                    docker run -d \
                    --name ${CONTAINER_NAME} \
                    -p ${HOST_PORT}:${APP_PORT} \
                    --env-file /opt/clickup-automation/.env \
                    --restart always \
                    ${IMAGE_NAME}
                '''
            }
        }

        stage('Check Running Container') {
            steps {
                sh 'docker ps | grep ${CONTAINER_NAME}'
            }
        }
    }

    post {
        success {
            echo 'Deploy success'
        }
        failure {
            echo 'Deploy failed'
        }
    }
}