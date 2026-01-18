# 📡 ET4290 - Antenna Array Factor Visualization

![Language](https://img.shields.io/badge/Language-HTML5%20%7C%20JavaScript-orange)
![Library](https://img.shields.io/badge/Library-Plotly.js%20%7C%20MathJax-blue)
![Course](https://img.shields.io/badge/Course-ET4290-green)

Một công cụ mô phỏng trực quan, tương tác thời gian thực dành cho môn học **Kỹ thuật Anten & Truyền sóng**. Dự án giúp sinh viên và người nghiên cứu hình dung rõ ràng về **Hệ số mảng (Array Factor)** của mảng tuyến tính (Linear Array) và mảng phẳng (Planar Array).

🔗 **[Truy cập Demo Trực tuyến](https://boonrealquer1504.github.io/ET4290-Array-Factor-Visualization/)** *(Bạn cần bật GitHub Pages trong phần Settings để link này hoạt động)*

---

## ✨ Tính năng nổi bật

### 1. Mảng Tuyến Tính (Uniform Linear Array - ULA)
* **Tham số đầu vào linh hoạt:** Số phần tử ($N$), khoảng cách ($d$), tần số ($f$), pha kích thích ($\beta$).
* **Chế độ cài sẵn:** Tự động tính toán pha $\beta$ cho chế độ **Broadside** ($\theta = 90^\circ$) và **End-fire** ($\theta = 0^\circ$).
* **Đồ thị đa dạng:**
    * Đồ thị Hệ số mảng phẳng (Cartesian - dB scale).
    * Đồ thị Tọa độ cực (Polar Plot - dB scale).
    * Mô phỏng bức xạ 3D xoay 360 độ.
* **Thông số kỹ thuật tự động:** Tính toán độ rộng búp sóng nửa công suất (**HPBW**), mức búp phụ (**SLL**), và độ định hướng (**Directivity**).

### 2. Mảng Phẳng (Planar Array - 2D)
* **Cấu trúc $M \times N$:** Mô phỏng mảng chữ nhật với khoảng cách $d_x, d_y$ tùy chỉnh.
* **Không gian $u-v$ (Balanis):** Hiển thị đồ thị 3D trong hệ tọa độ cosine hướng (theo sách *Antenna Theory* của C.A. Balanis).
* **Beam Steering 3D:** Lái búp sóng chính đến bất kỳ hướng $(\theta_0, \phi_0)$ nào trong không gian.
* **Phân tích mặt cắt 2D:** Cho phép "cắt lớp" đồ thị 3D tại các góc $\phi$ khác nhau để xem mặt cắt Polar chi tiết trên thang đo dB.

---

## 🚀 Hướng dẫn cài đặt & Sử dụng

Dự án được viết bằng HTML/JS thuần (Vanilla JS), không cần cài đặt môi trường phức tạp (Node.js hay Python).

### Cách 1: Chạy trực tiếp
1.  Tải toàn bộ code về máy (Download ZIP) hoặc clone repo:
    ```bash
    git clone [https://github.com/BoonRealQuer1504/ET4290-Array-Factor-Visualization.git](https://github.com/BoonRealQuer1504/ET4290-Array-Factor-Visualization.git)
    ```
2.  Mở file `index.html` (cho mảng 1 chiều) hoặc `planar.html` (cho mảng 2 chiều) bằng trình duyệt web bất kỳ (Chrome, Edge, Firefox...).
3.  **Lưu ý:** Máy tính cần có kết nối Internet để tải thư viện đồ thị `Plotly.js` và công thức toán `MathJax` từ CDN.

### Cách 2: Xem online
Truy cập vào link GitHub Pages của dự án (nếu đã kích hoạt).

---

## 📚 Cơ sở lý thuyết

Công cụ dựa trên lý thuyết mảng anten cơ bản:

**1. Hệ số mảng tuyến tính (ULA):**
$$ AF = \sum_{n=0}^{N-1} e^{j n (kd \cos\theta + \beta)} $$

**2. Hệ số mảng phẳng (Planar Array):**
$$ AF_{total}(\theta, \phi) = \left\{ \sum_{m=1}^{M} I_{m1} e^{j(m-1)(kd_x \sin\theta \cos\phi + \beta_x)} \right\} \times \left\{ \sum_{n=1}^{N} I_{1n} e^{j(n-1)(kd_y \sin\theta \sin\phi + \beta_y)} \right\} $$

---

## 🛠 Công nghệ sử dụng
* **HTML5 / CSS3:** Giao diện người dùng hiện đại, responsive.
* **JavaScript (ES6):** Xử lý logic tính toán số học phức tạp.
* **[Plotly.js](https://plotly.com/javascript/):** Thư viện vẽ đồ thị 2D/3D tương tác mạnh mẽ.
* **[MathJax](https://www.mathjax.org/):** Hiển thị công thức toán học LaTeX đẹp mắt.

---