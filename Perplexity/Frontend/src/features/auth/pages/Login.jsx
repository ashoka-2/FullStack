import React, { useState, useEffect, useRef } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useAuth } from "../hook/useAuth";
import { useSelector, useDispatch } from 'react-redux';
import FormField from '../components/FormField';
import Toast from '../../Components/Toast';
import { clearError } from '../auth.slice';
import { RiLoginCircleLine, RiLoader4Line, RiSparkling2Line } from '@remixicon/react';
import gsap from 'gsap';

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { handleLogin } = useAuth();
    
    const containerRef = useRef(null)
    const headerRef = useRef(null)
    const formRef = useRef(null)

    const user = useSelector(state => state.auth.user)
    const loading = useSelector(state => state.auth.loading)
    const reduxError = useSelector(state => state.auth.error)

    useEffect(() => {
        const tl = gsap.timeline();

        tl.fromTo(containerRef.current,
            { opacity: 0, scale: 0.98, y: 30 },
            { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: "power4.out" }
        )

        tl.fromTo(headerRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
            "-=0.8"
        )

        tl.fromTo(formRef.current?.children,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" },
            "-=0.5"
        )

        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const submitForm = async (event) => {
        event.preventDefault()
        dispatch(clearError())

        try {
            await handleLogin({ email, password })
            navigate("/")
        } catch (err) {
            // Error is handled in useAuth via dispatch
        }
    }

    if (user && !loading) {
        return <Navigate to="/" replace />
    }

    return (
        <section className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center p-6 selection:bg-[#60A6AF]/30 transition-colors duration-300">
            <div 
                ref={containerRef}
                className="w-full max-w-[480px] bg-zinc-50 dark:bg-[#191a1a] border border-zinc-200 dark:border-[#2d2e2e] rounded-3xl p-10 shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
                {/* Perplexity Glow Effects */}
                <div className="absolute -top-[10%] -right-[10%] w-[300px] h-[300px] bg-[#60A6AF]/5 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[250px] h-[250px] bg-[#60A6AF]/3 blur-[80px] rounded-full pointer-events-none" />

                <div ref={headerRef} className="relative z-10 flex flex-col items-center text-center mb-10">
                    <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl mb-6 flex items-center justify-center border border-zinc-200 dark:border-[#2d2e2e] shadow-inner">
                        <RiLoginCircleLine className="w-7 h-7 text-[#60A6AF]" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                        Welcome back
                    </h1>
                    <p className="text-zinc-500 mt-3 text-sm font-medium">Continue your discovery journey with speed.</p>
                </div>

                <form 
                    ref={formRef}
                    onSubmit={submitForm} 
                    className="space-y-6"
                >
                    <FormField
                        label="Email"
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                    />
                    <FormField
                        label="Password"
                        type="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                    />

                    <div className="flex justify-end">
                        <Link to="/forgot-password" size="sm" className="text-[#60A6AF] text-xs font-bold hover:underline cursor-pointer tracking-wide">
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-[#60A6AF] hover:bg-[#1da9bc] text-zinc-950 font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.98] shadow-xl shadow-[#60A6AF]/10 mt-2 cursor-pointer flex items-center justify-center gap-2
                            ${loading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {loading ? (
                            <>
                                <RiLoader4Line className="animate-spin w-5 h-5 text-zinc-950" />
                                Signing in...
                            </>
                        ) : (
                            <>
                                <span>Sign In</span>
                                <RiSparkling2Line className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 text-center relative z-10">
                    <p className="text-zinc-500 text-sm font-medium">
                        New to Perplexity?{' '}
                        <Link to="/register" className="text-[#20b8cd] hover:text-[#1da9bc] font-bold transition-colors underline-offset-4 hover:underline cursor-pointer">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>

            <Toast 
                message={reduxError} 
                type="error" 
                onClose={() => dispatch(clearError())} 
            />
        </section>
    )
}

export default Login