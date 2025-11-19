// public/login/script_login.js － 通用整合版
document.addEventListener('DOMContentLoaded', () => {
  // 三種角色都綁定（頁面沒有對應表單也沒關係）
  bindLogin('adminForm',  '/admin/login',  () => '/admin/');
  bindLogin('sellerForm', '/seller/login', () => '/seller/');  // 之後改成你的賣家首頁路徑
  bindLogin('buyerForm',  '/buyer/login',  () => '/buyer/');   // 之後改成你的買家首頁路徑
});

function bindLogin(formId, apiPath, resolveRedirect) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const msg = form.querySelector('.error-msg');
    const submitBtn = form.querySelector('button[type="submit"]');

    // 支援 *Email 或 *Username 兩種命名
    const base = formId.replace('Form',''); // admin / seller / buyer
    const emailEl = form.querySelector(`#${base}Email`) || form.querySelector(`#${base}Username`);
    const passEl  = form.querySelector(`#${base}Password`);

    if (!emailEl || !passEl) {
      showMsg(msg, '欄位設定有誤（缺少 Email/Username 或 Password）');
      return;
    }

    const email = (emailEl.value || '').trim();
    const password = passEl.value || '';
    if (!email || !password) {
      showMsg(msg, '帳號與密碼為必填');
      return;
    }

    hideMsg(msg);
    if (submitBtn) { submitBtn.disabled = true; submitBtn.dataset._txt = submitBtn.textContent; submitBtn.textContent = '登入中...'; }

    try {
      const resp = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await safeJson(resp);
      // 成功條件：/admin/login 會回 { token: 'DEV_TOKEN', ... }
      // /seller/login /buyer/login 我們也回 { success:true, token? }
      if (resp.ok && (data.token || data.success)) {
        if (data.token) localStorage.setItem('token', data.token);
        // 不同角色導向不同頁（可自行調整）
        window.location.href = resolveRedirect();
      } else {
        showMsg(msg, data?.error || '登入失敗');
      }
    } catch (err) {
      console.error(err);
      showMsg(msg, '網路或伺服器錯誤');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtn.dataset._txt || 'LOGIN'; }
    }
  });
}

function showMsg(node, text){ if(node){ node.textContent = text; node.style.display = 'block'; } }
function hideMsg(node){ if(node){ node.textContent = ''; node.style.display = 'none'; } }
async function safeJson(resp){ try{ return await resp.json(); }catch{ return null; } }
