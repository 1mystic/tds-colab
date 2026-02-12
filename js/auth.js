/* ===== AUTH MODULE ===== */
const Auth = (() => {
    const ADMIN_ROLL = 'mitzig01';
    const ROLL_REGEX = /^2[1-5]f[1-3]\d{4,8}$/i;
    const SESSION_KEY = 'tds_user';

    function validate(roll) {
        if (!roll) return false;
        const r = roll.trim().toLowerCase();
        return r === ADMIN_ROLL || ROLL_REGEX.test(r);
    }

    function isAdmin() {
        const u = getUser();
        return u && u.toLowerCase() === ADMIN_ROLL;
    }

    function getUser() {
        return sessionStorage.getItem(SESSION_KEY);
    }

    function setUser(roll) {
        sessionStorage.setItem(SESSION_KEY, roll.trim().toLowerCase());
    }

    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        location.reload();
    }

    function init() {
        const overlay = document.getElementById('auth-overlay');
        const input = document.getElementById('roll-input');
        const btn = document.getElementById('auth-btn');
        const error = document.getElementById('auth-error');

        if (getUser()) {
            overlay.classList.add('hidden');
            return true;
        }

        overlay.classList.remove('hidden');

        const attempt = () => {
            const val = input.value.trim();
            if (!val) {
                error.textContent = 'Please enter your roll number';
                input.classList.add('error');
                setTimeout(() => input.classList.remove('error'), 400);
                return;
            }
            if (!validate(val)) {
                error.textContent = 'Invalid roll number format';
                input.classList.add('error');
                setTimeout(() => input.classList.remove('error'), 400);
                return;
            }
            error.textContent = '';
            setUser(val);
            overlay.classList.add('fade-out');
            setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.classList.remove('fade-out');
                App.init();
            }, 500);
        };

        btn.addEventListener('click', attempt);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') attempt();
        });
        input.focus();
        return false;
    }

    return { init, getUser, isAdmin, logout, validate };
})();
