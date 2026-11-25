# Step-by-Step Deployment Guide on AWS

## Step 1: Launch and Configure the EC2 Instance
1. **Launch the Instance:** Log in to the AWS Management Console, navigate to the EC2 service, and click Launch instance.
2. **Choose OS and Instance Type:**
   * Select an Amazon Machine Image such as Amazon Linux
3. **Configure SSH Access:** Create a new Key pair, download the `.pem` file to your local machine, and store it securely.
4. **Configure Network Settings (Security Group):**
   * Check Allow SSH traffic so you can connect to your instance remotely.
   * Check Allow HTTP traffic from the internet.
   * Open your application port: In the Inbound rules, add a Custom TCP rule for port 8080 with the source set to `0.0.0.0/0`.
5. **Start the Instance:** Click Launch instance.

---

## Step 2: Connect to the Instance via SSH
1. Copy the **Public IPv4 address** of your instance from the EC2 dashboard.
2. Open your local terminal, restrict the permissions of your private key, and connect to the instance:
   ```bash
   chmod 400 your-key.pem
   ssh -i "your-key.pem" ec2-user@<YOUR_PUBLIC_IP>
   ```

---

## Step 3: Prepare the Environment and Install Dependencies
Update the system packages and install **Git**, **Node.js**, and **npm** using `yum`:
```bash
sudo yum install -y git nodejs npm
```
*(Optional: Verify the installations by running `git --version`, `node -v`, and `npm -v`.)*

---

## Step 4: Clone the Repository from GitHub
1. Clone the application's source code onto the EC2 instance:

2. Navigate into the project directory:

---

## Step 5: Install Project Dependencies and Launch the Application
1. Install the required Node.js dependencies listed in `package.json`:
   ```bash
   npm install
   ```
2. Start the web application:
   ```bash
   node app.js
   ```
3. **Verify Deployment:** Open your browser and navigate to `http://<YOUR_PUBLIC_IP>:8080` to access the live application.
