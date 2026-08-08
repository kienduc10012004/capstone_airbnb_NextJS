const fs = require('fs');
const path = require('path');
const https = require('https');

console.log("=== KIỂM TRA KẾT NỐI API / DATABASE (NEXT.JS CAPSTONE) ===\n");

// 1. Kiểm tra file .env hoặc .env.local
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const envLocalPath = path.join(rootDir, '.env.local');

let envExists = false;
let envContent = '';

if (fs.existsSync(envPath)) {
  console.log("✔ Đã tìm thấy file .env");
  envExists = true;
  envContent = fs.readFileSync(envPath, 'utf8');
} else if (fs.existsSync(envLocalPath)) {
  console.log("✔ Đã tìm thấy file .env.local");
  envExists = true;
  envContent = fs.readFileSync(envLocalPath, 'utf8');
} else {
  console.log("❌ KHÔNG TÌM THẤY file .env hoặc .env.local ở thư mục gốc!");
}

let apiUrl = 'https://airbnbnew.cybersoft.edu.vn/api';
let tokenCybersoft = '';

if (envExists) {
  const urlMatch = envContent.match(/NEXT_PUBLIC_API_URL\s*=\s*(.+)/);
  const tokenMatch = envContent.match(/NEXT_PUBLIC_TOKEN_CYBERSOFT\s*=\s*(.+)/);
  if (urlMatch) apiUrl = urlMatch[1].trim();
  if (tokenMatch) tokenCybersoft = tokenMatch[1].trim();
}

console.log("\n--- Thông tin cấu hình hiện tại ---");
console.log("NEXT_PUBLIC_API_URL:", apiUrl || "(Chưa có)");
console.log("NEXT_PUBLIC_TOKEN_CYBERSOFT:", tokenCybersoft ? "(Đã có token)" : "❌ KHÔNG CÓ TOKEN");

// 2. Kiểm tra gọi thử API Cybersoft
console.log("\n--- Thử nghiệm gửi Request tới API backend ---");
const targetUrl = `${apiUrl}/vi-tri`;
console.log(`GET ${targetUrl}`);

const options = {
  headers: {
    'accept': 'application/json',
    'tokenCybersoft': tokenCybersoft
  }
};

const req = https.get(targetUrl, options, (res) => {
  console.log(`\nResponse Status Code: ${res.statusCode} ${res.statusMessage}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log("Response Body (rút gọn):", JSON.stringify(parsed).slice(0, 300) + "...");
      if (res.statusCode === 200) {
        console.log("\n✅ KẾT NỐI API THÀNH CÔNG! Đã lấy được dữ liệu.");
      } else {
        console.log("\n❌ THẤT BẠI: Server phản hồi mã lỗi", res.statusCode);
      }
    } catch (e) {
      console.log("Response Raw Text:", data.slice(0, 300));
    }
  });
});

req.on('error', (err) => {
  console.error("\n❌ LỖI KẾT NỐI MẠNG / DNS / TIMEOUT:", err.message);
});
