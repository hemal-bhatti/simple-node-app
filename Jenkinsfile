pipeline {
    agent {
        label 'jenkins-agent' 
    }

    environment {
        // 1. Core Configurations
        DOCKER_HUB_USER  = 'hemal45' // Change to your actual Docker Hub username
        IMAGE_NAME       = 'simple-node' // Change to your actual image name
        IMAGE_TAG        = "${BUILD_NUMBER}"
        AWS_REGION       = 'ap-south-1'              // Change to your AWS region
        
        // 2. Target Application EC2 Configurations
        TARGET_INSTANCE_ID = 'i-061c64da266ecc597'   // Change to your App EC2 Instance ID
        APP_DIR            = '/var/www/simple-app/simple-backend'      // Directory where docker-compose.yml lives on App EC2
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Pulling source code from Git Repository...'
                checkout scm
            }
        }

        stage('Fetch Docker Hub Credentials') {
            steps {
                echo 'Retrieving Docker Hub credentials securely via IAM Role...'
                script {
                    // Pulls secret JSON from AWS Secrets Manager using the Agent's IAM Role
                    // def secret = sh(script: "aws secretsmanager get-secret-value --secret-id dockerhub-creds --region ${AWS_REGION} --query SecretString --output text", returnStdout: true).trim()
                    // def props = new groovy.json.JsonSlurper().parseText(secret)
                    
                    sh "set +x"
                    env.DOCKER_USER = 'hemal45' // Change to your actual Docker Hub username
                    env.DOCKER_PASS = '#Hemal@2004' // Change to your actual Docker Hub password or token
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image: ${DOCKER_HUB_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
                sh "docker build -t ${DOCKER_HUB_USER}/${IMAGE_NAME}:${IMAGE_TAG} ."
                sh "docker tag ${DOCKER_HUB_USER}/${IMAGE_NAME}:${IMAGE_TAG} ${DOCKER_HUB_USER}/${IMAGE_NAME}:latest"
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo 'Logging into Docker Hub and pushing image...'
                sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                sh "docker push ${DOCKER_HUB_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
                sh "docker push ${DOCKER_HUB_USER}/${IMAGE_NAME}:latest"
                sh "docker logout"
            }
        }

        stage('Deploy via SSM Run Command') {
            steps {
                echo "Executing deployment on Target EC2 (${TARGET_INSTANCE_ID}) using AWS SSM..."
                script {
                    // Enclosing the shell commands that will run inside the target App EC2 instance
                    def deploymentCommands = [
                        "cd ${APP_DIR}",
                        // Use sed to search for the image line in docker-compose.yml and swap it with the new tag
                        "sed -i 's|image: ${DOCKER_HUB_USER}/${IMAGE_NAME}:.*|image: ${DOCKER_HUB_USER}/${IMAGE_NAME}:${IMAGE_TAG}|g' docker-compose.yml",
                        // Pull the new explicit image layer
                        "docker compose pull || docker-compose pull",
                        // Recreate the container with zero-downtime flags if supported, or standard up
                        "docker compose up -d --remove-orphans || docker-compose up -d --remove-orphans"
                    ].join(" && ")

                    // Execute via AWS SSM using the Jenkins Agent's IAM Instance Profile
                    sh """
                        aws ssm send-command \
                            --document-name "AWS-RunShellScript" \
                            --instance-ids "${TARGET_INSTANCE_ID}" \
                            --parameters 'commands=["${deploymentCommands}"]' \
                            --region "${AWS_REGION}"
                    """
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up worker node environment...'
            sh "docker rmi ${DOCKER_HUB_USER}/${IMAGE_NAME}:${IMAGE_TAG} || true"
            sh "docker rmi ${DOCKER_HUB_USER}/${IMAGE_NAME}:latest || true"
            cleanWs()
        }
    }
}