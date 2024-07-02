"use client"

import axios from 'axios';
import { useState, ChangeEvent, FormEvent } from 'react';
import Cookies from 'js-cookie';
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

const Login: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/auth/jwt/create/', formData);
      if (response.data && response.data.access) {
        Cookies.set('authToken', response.data.access); // Store JWT in a cookie
        // console.log("Username set:", Cookies.get('username'));

        const userDetails = await axios.get('http://127.0.0.1:8000/auth/users/me/', {
        headers: {
            'Authorization': `Bearer ${response.data.access}`
        }
      });

      if (userDetails.data) {
        // Store username in a state or local storage or context
        Cookies.set('username', userDetails.data.username);
     }

        // Redirect to dashboard or update UI accordingly
        console.log("Logged in successfully");
        toast.success("Logged in successfully")
        router.push(`/`);
      }
    } catch (error) {
      console.error("Error logging in:", error);
      toast.error("Error logging in")
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          onChange={handleInputChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleInputChange}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
