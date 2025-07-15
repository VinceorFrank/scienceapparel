import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../../utils/lang";
import api from "../../api/config";

const LoginCustomer = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { t } = useLang();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/users/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.data.token);
      localStorage.setItem("userName", res.data.data.user.name);
      localStorage.setItem("userEmail", res.data.data.user.email);
      localStorage.setItem("userRole", "customer");

      navigate("/account");
    } catch (err) {
      setError(t('invalidCredentials'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">{t('customerLogin')}</h2>
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
        <input
          type="email"
          placeholder={t('email')}
          className="w-full border p-2 mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder={t('password')}
          className="w-full border p-2 mb-6"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {t('login')}
        </button>
      </form>
      <div className="mt-4 text-center text-sm text-gray-600">
        {t('noAccountYet')} {' '}
        <a href="/signup" className="text-blue-600 hover:underline">{t('createAccount')}</a>
      </div>
    </div>
  );
};

export default LoginCustomer;
