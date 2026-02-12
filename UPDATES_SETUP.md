# نظام التحديث التلقائي للتطبيق

## الآلية

عند publish الكود من Lovable، يتم:

1. **GitHub Actions** تكتشف التغييرات تلقائياً
2. تحدّث ملف `public/version.json` برقم إصدار جديد و timestamp
3. عند فتح المستخدم للتطبيق في الموبايل:
   - Service Worker يتحقق من `version.json` كل ساعة
   - إذا كان هناك إصدار أحدث، يُحدّث التطبيق تلقائياً
   - يظهر إشعار للمستخدم: "تحديث جديد متاح"

## الوثائق

### 1. ملفات التحديث الجديدة:

- **`src/utils/updateManager.ts`** - منطق التحقق من التحديثات
- **`src/hooks/useAutoUpdate.ts`** - React hook للتحديثات
- **`.github/workflows/update-version.yml`** - CI/CD automation
- **`public/version.json`** - ملف الإصدار الحالي

### 2. خطوات publish من Lovable:

1. اعمل تغييرات في Lovable
2. اضغط **Publish**
3. الكود يُدفع إلى GitHub (branch main)
4. GitHub Actions يعمل تلقائياً:
   ```
   ✓ يحدث version.json
   ✓ يعيد deploy التطبيق
   ✓ المستخدمين يحصلون على update تلقائي
   ```

### 3. مدة التحديث:

- **عند فتح التطبيق مباشرة**: التحقق فوري
- **بعد ذلك**: كل 60 دقيقة
- **Speed**: بسبب VitePWA، التحديثات سريعة جداً

### 4. اختبار محلياً:

```bash
# بناء التطبيق
npm run build

# معاينة الـ version endpoint
cat public/version.json

# بعد أي تغيير، يمكن تحديث يدوي:
node scripts/update-version.js
```

### 5. الإعدادات:

في `src/utils/updateManager.ts` يمكنك تغيير:

```typescript
// الفترة بين التحقق من التحديثات (حالياً: ساعة واحدة)
const VERSION_CHECK_INTERVAL = 60 * 60 * 1000;

// تأخير إعادة التحميل بعد التحديث
setTimeout(() => {
  window.location.reload();
}, 2000); // غيّر 2000 إلى الوقت اللي تبيه (بـ ميلي ثانية)
```

## الفوائد

✅ **تحديث تلقائي** - لا حاجة لـ manual update  
✅ **PWA native** - يعمل كـ app محلي  
✅ **تنبيهات واضحة** - المستخدم يعرف متى يحصل update  
✅ **سريع وآمن** - VitePWA يتعامل مع الـ caching  

## في حالة المشاكل:

- افتح DevTools → Console لرؤية logs
- تحقق من `localStorage.appVersion` لرؤية الإصدار الحالي
- تأكد أن `public/version.json` موجود و محدّث
