# 給媽媽的生日禮物

Steven、Kevin、Nancy 送給媽媽的互動生日禮券網站。純靜態 HTML / CSS / JavaScript，部署在 GitHub Pages。

## 流程

拆開信封 → 閱讀祝福 → 揭曉「媽媽專屬變美基金 NT$36,000」→ 保存禮券或重新拆一次。

## 檔案

| 檔案 | 用途 |
|---|---|
| `index.html` | 頁面結構與文字 |
| `style.css` | 樣式與動畫 |
| `script.js` | 場景切換與保存禮券 |
| `assets/gift-card.png` | 2400 × 1600 禮券圖片，供保存與列印 |
| `assets/og-cover.png` | LINE 連結預覽圖，不含金額 |
| `tools/*.html` | 產生上面兩張圖的原始版面 |

## 本機預覽

```bash
python3 -m http.server 8931
```

打開 http://127.0.0.1:8931/ 即可。直接雙擊 `index.html` 也能看，但保存功能的分享按鈕需要 http 環境。

## 重新產生圖片

修改 `tools/gift-card.html` 或 `tools/og-cover.html` 後執行：

```bash
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$C" --headless=new --hide-scrollbars --force-device-scale-factor=2 --window-size=1200,800 --virtual-time-budget=8000 --screenshot="$PWD/assets/gift-card.png" "file://$PWD/tools/gift-card.html"
"$C" --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=8000 --screenshot="$PWD/assets/og-cover.png" "file://$PWD/tools/og-cover.html"
```

## 說明

這是家人承諾支付的禮物，不是醫療機構發行的儲值憑證。網站不收集任何資料，不需要後端或 API。
