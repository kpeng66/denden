"use client"

import axios from 'axios';
import { useState, ChangeEvent, FormEvent } from 'react';
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";


const Register: React.FC = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: ''
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
            const response = await axios.post('http://127.0.0.1:8000/auth/users/', formData);
            if (response.data) {
                console.log("Registered successfully");
                toast.success("Registered successfully")
                // redirect to home page
                router.push(`/`);


            }
        } catch (error) {
            console.log("Error registering user:", error);
            toast.success("Error registering user")
        }
    };

    return (
        <div>
        <h2>Register</h2>
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
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleInputChange}
          />
          <button type="submit">Register</button>
        </form>
      </div>
    )
}

export default Register;
