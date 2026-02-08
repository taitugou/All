# Linux 部署指南

本指南将帮助你在 Linux 服务器上部署 TTG 导航项目。

## 1. 环境准备

确保服务器已安装 Git 和 Node.js。

### 安装 Git
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install git -y

# CentOS/RHEL
sudo yum install git -y
```

### 安装 Node.js
推荐使用 NodeSource 安装最新稳定版：

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo yum install -y nodejs
```

验证安装：
```bash
node -v
npm -v
```

---

## 2. 获取代码

将代码克隆到服务器目录 `/root/ttg-all`：

```bash
# 如果目录不存在，git clone 会自动创建
cd /root
git clone https://github.com/taitugou/All.git ttg-all
cd ttg-all
```

> **注意**：如果这是私有仓库，你需要配置 SSH Key 或在 clone 时输入用户名密码。

---

## 3. 启动服务

本项目是一个纯静态网站配合一个轻量级 Node.js 服务端，没有额外的 npm 依赖。

### 方式一：直接运行（用于测试）

```bash
node server.js
```
*   默认端口为 **81**。
*   访问 `http://<服务器IP>:81` 即可看到页面。
*   按 `Ctrl + C` 停止服务。

### 方式二：使用 PM2 后台运行（生产环境推荐）

PM2 是一个强大的 Node.js 进程管理工具，可以让服务在后台常驻，并支持开机自启。

1.  **安装 PM2**
    ```bash
    npm install -g pm2
    ```

2.  **启动服务**
    确保你在项目目录 `/root/ttg-all` 下：
    ```bash
    cd /root/ttg-all
    pm2 start server.js --name "ttg-all"
    ```

3.  **查看状态**
    ```bash
    pm2 list
    ```

4.  **设置开机自启**
    ```bash
    pm2 startup
    pm2 save
    ```

---

## 4. 进阶配置：使用 Nginx 反向代理（推荐）

为了更安全地提供服务，建议使用 Nginx 将 80/443 端口转发到 81 端口。

1.  **安装 Nginx**
    ```bash
    # Ubuntu
    sudo apt install nginx -y
    # CentOS
    sudo yum install nginx -y
    ```

2.  **配置 Nginx**
    编辑配置文件：
    ```bash
    sudo nano /etc/nginx/conf.d/ttg-all.conf
    ```
    
    写入以下内容：
    ```nginx
    server {
        listen 80;
        server_name your-domain.com;  # 替换为你的域名或IP

        location / {
            proxy_pass http://127.0.0.1:81;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

3.  **重启 Nginx**
    ```bash
    sudo nginx -t
    sudo systemctl restart nginx
    ```

现在你可以直接通过 `http://your-domain.com` 访问网站了。
