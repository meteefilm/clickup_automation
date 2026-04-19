pipeline {
    agent { label "swarm" }

    environment {
        PROJECT = "clickup-automation"
        SERVICE_NAME = "clickup-automation"
        GIT_REPO = 'http://your-git-repo-url.git'
        GIT_BRANCH = 'main'
        DOCKER_IMAGE = '199.168.50.160:5000/clickup-automation'
        PORT = '8319'
        CLICKUP_TOKEN = credentials('clickup-token')
    }

    stages {
        stage('Checkout') {
            agent { label "Nexus" }
            steps {
                git branch: "${GIT_BRANCH}",
                    url: "${GIT_REPO}",
                    credentialsId: 'GitLab_Connect'
            }
            post {
                always {
                    echo 'Checkout stage completed'
                }
            }
        }

        stage('Install & Build') {
            agent { label "Nexus" }
            steps {
                script {
                    if (isUnix()) {
                        sh '''
                        echo "Running on Unix-like node"
                        npm ci
                        npm run build
                        '''
                    } else {
                        bat '''
                        echo Running on Windows node
                        call npm ci
                        call npm run build
                        '''
                    }
                }
            }
            post {
                always {
                    echo 'Install & Build stage completed'
                }
            }
        }

        stage('Docker Build & Push') {
            agent { label "Nexus" }
            steps {
                script {
                    if (isUnix()) {
                        sh '''
                        docker build --no-cache --build-arg PORT=${PORT} -t ${PROJECT}:${BUILD_NUMBER} .
                        docker tag ${PROJECT}:${BUILD_NUMBER} ${DOCKER_IMAGE}:${BUILD_NUMBER}
                        docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}
                        docker rmi ${PROJECT}:${BUILD_NUMBER} --force
                        '''
                    } else {
                        bat '''
                        docker build --no-cache --build-arg PORT=${PORT} -t %PROJECT%:%BUILD_NUMBER% .
                        docker tag %PROJECT%:%BUILD_NUMBER% %DOCKER_IMAGE%:%BUILD_NUMBER%
                        docker push %DOCKER_IMAGE%:%BUILD_NUMBER%
                        docker rmi %PROJECT%:%BUILD_NUMBER% --force
                        '''
                    }
                }
            }
            post {
                always {
                    echo 'Docker Build & Push stage completed'
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    if (isUnix()) {
                        sh '''
                            if [ "$(docker service ls --filter name=${SERVICE_NAME} -q)" ]; then
                                echo "Service ${SERVICE_NAME} exists. Updating..."
                                docker service update \
                                    --image ${DOCKER_IMAGE}:${BUILD_NUMBER} \
                                    --env-add PORT=${PORT} \
                                    --env-add CLICKUP_TOKEN=${CLICKUP_TOKEN} \
                                    ${SERVICE_NAME}
                            else
                                echo "Service ${SERVICE_NAME} does not exist. Creating..."
                                docker service create \
                                    --publish mode=host,published=${PORT},target=${PORT} \
                                    --replicas 1 \
                                    --env TZ=Asia/Bangkok \
                                    --env PORT=${PORT} \
                                    --env CLICKUP_TOKEN=${CLICKUP_TOKEN} \
                                    --constraint "node.role==worker" \
                                    --name ${SERVICE_NAME} \
                                    ${DOCKER_IMAGE}:${BUILD_NUMBER}
                            fi
                        '''
                    } else {
                        bat '''
                            docker service inspect %SERVICE_NAME% >nul 2>&1 && (
                                echo Service %SERVICE_NAME% exists. Updating...
                                docker service update ^
                                    --image %DOCKER_IMAGE%:%BUILD_NUMBER% ^
                                    --env-add PORT=%PORT% ^
                                    %SERVICE_NAME%
                            ) || (
                                echo Service %SERVICE_NAME% does not exist. Creating...
                                docker service create ^
                                    --publish mode=host,published=%PORT%,target=%PORT% ^
                                    --replicas 1 ^
                                    --env TZ=Asia/Bangkok ^
                                    --env PORT=%PORT% ^
                                    --constraint "node.role==worker" ^
                                    --name %SERVICE_NAME% ^
                                    %DOCKER_IMAGE%:%BUILD_NUMBER%
                            )
                        '''
                    }
                }
            }
            post {
                always {
                    echo 'Deploy stage completed'
                }
            }
        }
    }

    post {
        always {
            script {
                if (isUnix()) {
                    sh '''
                    docker rmi ${PROJECT}:${BUILD_NUMBER} --force || true
                    '''
                } else {
                    bat '''
                    docker rmi %PROJECT%:%BUILD_NUMBER% --force
                    '''
                }
            }
            echo 'Cleanup completed'
        }
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}