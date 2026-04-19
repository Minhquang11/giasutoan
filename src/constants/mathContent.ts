export interface FormulaTopic {
  id: string;
  label: string;
  content: string;
}

export const FORMULA_DATA: Record<string, string> = {
  'ham-so': String.raw`
### 1. Sự biến thiên
- $y' > 0$: Hàm số đồng biến.
- $y' < 0$: Hàm số nghịch biến.

### 2. Cực trị
- $y' = 0$ và đổi dấu từ $+$ sang $-$: Cực đại.
- $y' = 0$ và đổi dấu từ $-$ sang $+$: Cực tiểu.
- Đối với hàm bậc 3: $y = ax^3 + bx^2 + cx + d$, cực trị tồn tại khi $b^2 - 3ac > 0$.

### 3. Tiệm cận
- $\lim_{x \to \infty} y = y_0 \implies y = y_0$ là tiệm cận ngang.
- $\lim_{x \to x_0} y = \infty \implies x = x_0$ là tiệm cận đứng.
  `,
  'nguyen-ham': String.raw`
### 1. Công thức cơ bản
- $\int x^n dx = \frac{x^{n+1}}{n+1} + C \quad (n \neq -1)$
- $\int \frac{1}{x} dx = \ln|x| + C$
- $\int e^x dx = e^x + C$
- $\int \sin x dx = -\cos x + C$
- $\int \cos x dx = \sin x + C$

### 2. Phương pháp giải
- **Đổi biến số:** Đặt $u = g(x) \implies du = g'(x)dx$.
- **Từng phần:** $\int u dv = uv - \int v du$ (Thứ tự ưu tiên đặt $u$: "Nhất lô, nhì đa, tam lượng, tứ mũ").
  `,
  'mu-log': String.raw`
### 1. Lũy thừa & Mũ
- $a^m \cdot a^n = a^{m+n}$
- $\frac{a^m}{a^n} = a^{m-n}$
- $(a^m)^n = a^{m \cdot n}$

### 2. Logarit
- $\log_a(bc) = \log_a b + \log_a c$
- $\log_a(\frac{b}{c}) = \log_a b - \log_a c$
- $\log_a b^n = n \log_a b$
- $\log_a b = \frac{\ln b}{\ln a}$ (Công thức đổi cơ số)
  `,
  'so-phuc': String.raw`
### 1. Định nghĩa
- $z = a + bi \quad (a, b \in \mathbb{R}, i^2 = -1)$
- Số phức liên hợp: $\bar{z} = a - bi$
- Môđun: $|z| = \sqrt{a^2 + b^2}$

### 2. Phép toán
- Cộng/Trừ: $(a+bi) \pm (c+di) = (a\pm c) + (b\pm d)i$
- Nhân: $(a+bi)(c+di) = (ac-bd) + (ad+bc)i$
- Chia: $\frac{z_1}{z_2} = \frac{z_1 \cdot \bar{z_2}}{|z_2|^2}$
  `,
  'khoi-da-dien': String.raw`
### 1. Thể tích Khối Lăng Trụ
- $V = B \cdot h$ (B là diện tích đáy, h là chiều cao)

### 2. Thể tích Khối Chóp
- $V = \frac{1}{3} B \cdot h$

### 3. Khối tròn xoay
- **Hình Trụ:** $V = \pi r^2 h$, $S_{xq} = 2\pi rh$
- **Hình Nón:** $V = \frac{1}{3} \pi r^2 h$, $S_{xq} = \pi rl \quad (l = \text{đường sinh})$
- **Hình Cầu:** $V = \frac{4}{3} \pi r^3$, $S = 4\pi r^2$
  `
};
