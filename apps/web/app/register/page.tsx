"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, type CSSProperties } from "react";
import { useForm } from "react-hook-form";

import { registerSchema, type RegisterInput } from "@financial-system/types";

import { apiFetch } from "@/lib/api";
import { writeSession, type SessionState } from "@/lib/auth";

type Stage = "idle" | "account" | "password-hide" | "password-show" | "error" | "submitting";

export default function RegisterPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [blinkPurple, setBlinkPurple] = useState(false);
  const [blinkBlack, setBlinkBlack] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      realName: "",
      phone: "",
      email: ""
    }
  });

  const username = watch("username");
  const realName = watch("realName");
  const phone = watch("phone");
  const email = watch("email");
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  useEffect(() => {
    let purpleTimer = 0;
    let blackTimer = 0;

    const purpleLoop = () => {
      purpleTimer = window.setTimeout(() => {
        setBlinkPurple(true);
        window.setTimeout(() => setBlinkPurple(false), 150);
        purpleLoop();
      }, 3000 + Math.random() * 3500);
    };

    const blackLoop = () => {
      blackTimer = window.setTimeout(() => {
        setBlinkBlack(true);
        window.setTimeout(() => setBlinkBlack(false), 150);
        blackLoop();
      }, 2800 + Math.random() * 3800);
    };

    purpleLoop();
    blackLoop();

    return () => {
      window.clearTimeout(purpleTimer);
      window.clearTimeout(blackTimer);
    };
  }, []);

  useEffect(() => {
    const firstError = Object.values(errors)[0]?.message;
    if (!firstError) {
      return;
    }

    setStage("error");
    setErrorVisible(true);
    const timer = window.setTimeout(() => {
      const hasAccountField = username || realName || phone || email;
      const hasPasswordField = password || confirmPassword;
      setStage(hasPasswordField ? (showPassword ? "password-show" : "password-hide") : hasAccountField ? "account" : "idle");
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [errors, username, realName, phone, email, password, confirmPassword, showPassword]);

  const usernameField = register("username");
  const realNameField = register("realName");
  const phoneField = register("phone");
  const emailField = register("email");
  const passwordField = register("password");
  const confirmPasswordField = register("confirmPassword");

  const sceneStyle = useMemo(() => {
    const dx = (mouse.x - 0.5) * 10;
    const dy = (mouse.y - 0.5) * 8;

    const away = {
      "--purple-skew": "-9deg",
      "--purple-shift": "-8px",
      "--purple-height": "410px",
      "--purple-eyes-left": "20px",
      "--purple-eyes-top": "25px",
      "--purple-pupil-x": "-5px",
      "--purple-pupil-y": "-5px",
      "--black-skew": "7deg",
      "--black-shift": "-4px",
      "--black-eyes-left": "10px",
      "--black-eyes-top": "20px",
      "--black-pupil-x": "-4px",
      "--black-pupil-y": "-5px",
      "--orange-skew": "0deg",
      "--orange-eyes-left": "50px",
      "--orange-eyes-top": "75px",
      "--orange-pupil-x": "-5px",
      "--orange-pupil-y": "-5px",
      "--yellow-skew": "0deg",
      "--yellow-eyes-left": "20px",
      "--yellow-eyes-top": "30px",
      "--yellow-pupil-x": "-5px",
      "--yellow-pupil-y": "-5px",
      "--yellow-mouth-left": "15px",
      "--yellow-mouth-top": "78px",
      "--yellow-mouth-rotate": "0deg"
    } as CSSProperties;

    const account = {
      "--purple-skew": `${-6 + dx * 0.05}deg`,
      "--purple-shift": "18px",
      "--purple-height": "410px",
      "--purple-eyes-left": "50px",
      "--purple-eyes-top": "56px",
      "--purple-pupil-x": "3px",
      "--purple-pupil-y": "4px",
      "--black-skew": `${5 + dx * 0.05}deg`,
      "--black-shift": "10px",
      "--black-eyes-left": "28px",
      "--black-eyes-top": "18px",
      "--black-pupil-x": "0px",
      "--black-pupil-y": "-4px",
      "--orange-skew": `${dx * 0.1}deg`,
      "--orange-eyes-left": `${82 + dx}px`,
      "--orange-eyes-top": `${90 + dy}px`,
      "--orange-pupil-x": `${dx * 0.5}px`,
      "--orange-pupil-y": `${dy * 0.5}px`,
      "--yellow-skew": `${dx * -0.08}deg`,
      "--yellow-eyes-left": `${52 + dx}px`,
      "--yellow-eyes-top": `${40 + dy}px`,
      "--yellow-pupil-x": `${dx * 0.5}px`,
      "--yellow-pupil-y": `${dy * 0.4}px`,
      "--yellow-mouth-left": `${40 + dx}px`,
      "--yellow-mouth-top": `${88 + dy}px`,
      "--yellow-mouth-rotate": "0deg"
    } as CSSProperties;

    const show = {
      "--purple-skew": "0deg",
      "--purple-shift": "0px",
      "--purple-height": "370px",
      "--purple-eyes-left": "20px",
      "--purple-eyes-top": "35px",
      "--purple-pupil-x": "4px",
      "--purple-pupil-y": "5px",
      "--black-skew": "0deg",
      "--black-shift": "0px",
      "--black-eyes-left": "10px",
      "--black-eyes-top": "28px",
      "--black-pupil-x": "-4px",
      "--black-pupil-y": "-4px",
      "--orange-skew": "0deg",
      "--orange-eyes-left": "50px",
      "--orange-eyes-top": "85px",
      "--orange-pupil-x": "-5px",
      "--orange-pupil-y": "-4px",
      "--yellow-skew": "0deg",
      "--yellow-eyes-left": "20px",
      "--yellow-eyes-top": "35px",
      "--yellow-pupil-x": "-5px",
      "--yellow-pupil-y": "-4px",
      "--yellow-mouth-left": "10px",
      "--yellow-mouth-top": "88px",
      "--yellow-mouth-rotate": "0deg"
    } as CSSProperties;

    const errorPose = {
      "--purple-skew": "-8deg",
      "--purple-shift": "0px",
      "--purple-height": "370px",
      "--purple-eyes-left": "30px",
      "--purple-eyes-top": "55px",
      "--purple-pupil-x": "-3px",
      "--purple-pupil-y": "4px",
      "--black-skew": "8deg",
      "--black-shift": "0px",
      "--black-eyes-left": "15px",
      "--black-eyes-top": "40px",
      "--black-pupil-x": "-3px",
      "--black-pupil-y": "4px",
      "--orange-skew": "0deg",
      "--orange-eyes-left": "60px",
      "--orange-eyes-top": "95px",
      "--orange-pupil-x": "-3px",
      "--orange-pupil-y": "4px",
      "--yellow-skew": "0deg",
      "--yellow-eyes-left": "35px",
      "--yellow-eyes-top": "45px",
      "--yellow-pupil-x": "-3px",
      "--yellow-pupil-y": "4px",
      "--yellow-mouth-left": "30px",
      "--yellow-mouth-top": "92px",
      "--yellow-mouth-rotate": "-8deg"
    } as CSSProperties;

    const idle = {
      "--purple-skew": `${dx * -0.4}deg`,
      "--purple-shift": "0px",
      "--purple-height": "370px",
      "--purple-eyes-left": `${45 + dx}px`,
      "--purple-eyes-top": `${40 + dy}px`,
      "--purple-pupil-x": `${dx * 0.45}px`,
      "--purple-pupil-y": `${dy * 0.45}px`,
      "--black-skew": `${dx * -0.2}deg`,
      "--black-shift": "0px",
      "--black-eyes-left": `${26 + dx * 0.7}px`,
      "--black-eyes-top": `${32 + dy * 0.7}px`,
      "--black-pupil-x": `${dx * 0.35}px`,
      "--black-pupil-y": `${dy * 0.35}px`,
      "--orange-skew": `${dx * -0.15}deg`,
      "--orange-eyes-left": `${82 + dx}px`,
      "--orange-eyes-top": `${90 + dy}px`,
      "--orange-pupil-x": `${dx * 0.5}px`,
      "--orange-pupil-y": `${dy * 0.5}px`,
      "--yellow-skew": `${dx * -0.12}deg`,
      "--yellow-eyes-left": `${52 + dx}px`,
      "--yellow-eyes-top": `${40 + dy}px`,
      "--yellow-pupil-x": `${dx * 0.5}px`,
      "--yellow-pupil-y": `${dy * 0.4}px`,
      "--yellow-mouth-left": `${40 + dx}px`,
      "--yellow-mouth-top": `${88 + dy}px`,
      "--yellow-mouth-rotate": "0deg"
    } as CSSProperties;

    if (stage === "error") return errorPose;
    if (stage === "password-hide") return away;
    if (stage === "password-show" || stage === "submitting") return show;
    if (stage === "account") return account;
    return idle;
  }, [mouse, stage]);

  const submit = handleSubmit((values) => {
    setErrorVisible(false);
    setStage(showPassword ? "password-show" : "submitting");
    startTransition(async () => {
      try {
        const session = await apiFetch<SessionState>("/auth/register", {
          method: "POST",
          body: JSON.stringify(values)
        });
        writeSession(session);
        router.push("/employee/dashboard");
      } catch (error) {
        setErrorVisible(true);
        setError("confirmPassword", {
          message: error instanceof Error ? error.message : "Register failed. Please try again."
        });
      }
    });
  });

  return (
    <main className="auth-playful-page">
      <div className="auth-playful-shell" id="login-page">
        <section
          className={`left-panel left-panel--register ${stage === "error" ? "is-error" : ""}`}
          style={sceneStyle}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setMouse({
              x: (event.clientX - rect.left) / rect.width,
              y: (event.clientY - rect.top) / rect.height
            });
          }}
        >
          <div className="login-panel-copy">
            <div className="logo">
              <div className="brand-mark" aria-hidden="true">$</div>
              <span>Financial System</span>
            </div>
            <div className="scene-intro">
              <h2>Create Your Reimbursement Account</h2>
              <p>Register once to submit claims, upload invoices, follow review status, and access monthly records.</p>
            </div>
          </div>

          <div className="characters-wrapper">
            <div className="characters-scene">
              <div className="character char-purple">
                <div className="eyes purple-eyes">
                  <div className={`eyeball ${blinkPurple ? "is-blink" : ""}`}>
                    <div className="pupil purple-pupil" />
                  </div>
                  <div className={`eyeball ${blinkPurple ? "is-blink" : ""}`}>
                    <div className="pupil purple-pupil" />
                  </div>
                </div>
              </div>

              <div className="character char-black">
                <div className="eyes black-eyes">
                  <div className={`eyeball eyeball--small ${blinkBlack ? "is-blink" : ""}`}>
                    <div className="pupil black-pupil" />
                  </div>
                  <div className={`eyeball eyeball--small ${blinkBlack ? "is-blink" : ""}`}>
                    <div className="pupil black-pupil" />
                  </div>
                </div>
              </div>

              <div className="character char-orange">
                <div className="eyes orange-eyes">
                  <div className="bare-pupil orange-pupil" />
                  <div className="bare-pupil orange-pupil" />
                </div>
                <div className={`orange-mouth ${stage === "error" ? "visible shake-head" : ""}`} />
              </div>

              <div className="character char-yellow">
                <div className="eyes yellow-eyes">
                  <div className="bare-pupil yellow-pupil" />
                  <div className="bare-pupil yellow-pupil" />
                </div>
                <div className={`yellow-mouth ${stage === "error" ? "shake-head" : ""}`} />
              </div>
            </div>
          </div>

          <div className="footer-links">
            <span>Register</span>
            <span>Claims</span>
            <span>Invoices</span>
            <span>Review</span>
          </div>
        </section>

        <section className="right-panel">
          <div className="form-container form-container--wide">
            <div className="sparkle-icon">
              <div className="sparkle-mark" aria-hidden="true">$</div>
            </div>

            <div className="form-header">
              <h1>Create account</h1>
              <p>Employee onboarding for reimbursement, attachments, and tracking.</p>
            </div>

            <form onSubmit={submit}>
              <div className="register-grid">
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <div className="input-wrapper">
                    <input
                      {...usernameField}
                      id="username"
                      type="text"
                      autoComplete="username"
                      placeholder="choose a username"
                      className={errors.username ? "error" : ""}
                      onFocus={() => setStage("account")}
                      onBlur={() => setStage(password || confirmPassword ? (showPassword ? "password-show" : "password-hide") : "idle")}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="realName">Real name</label>
                  <div className="input-wrapper">
                    <input
                      {...realNameField}
                      id="realName"
                      type="text"
                      autoComplete="name"
                      placeholder="your real name"
                      className={errors.realName ? "error" : ""}
                      onFocus={() => setStage("account")}
                      onBlur={() => setStage(password || confirmPassword ? (showPassword ? "password-show" : "password-hide") : "idle")}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-wrapper">
                    <input
                      {...passwordField}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="create a password"
                      className={errors.password ? "error" : ""}
                      onFocus={() => setStage(showPassword ? "password-show" : "password-hide")}
                      onBlur={() => setStage(username || realName || phone || email ? "account" : "idle")}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm password</label>
                  <div className="input-wrapper">
                    <input
                      {...confirmPasswordField}
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="repeat the password"
                      className={errors.confirmPassword ? "error" : ""}
                      onFocus={() => setStage(showPassword ? "password-show" : "password-hide")}
                      onBlur={() => setStage(username || realName || phone || email ? "account" : "idle")}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <div className="input-wrapper">
                    <input
                      {...phoneField}
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="your phone number"
                      className={errors.phone ? "error" : ""}
                      onFocus={() => setStage("account")}
                      onBlur={() => setStage(password || confirmPassword ? (showPassword ? "password-show" : "password-hide") : "idle")}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <div className="input-wrapper">
                    <input
                      {...emailField}
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      className={errors.email ? "error" : ""}
                      onFocus={() => setStage("account")}
                      onBlur={() => setStage(password || confirmPassword ? (showPassword ? "password-show" : "password-hide") : "idle")}
                    />
                  </div>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} /> Show password
                </label>
                <span className="forgot-link">New employee registration</span>
              </div>

              <div className="error-msg" style={{ display: errorVisible || Object.keys(errors).length > 0 ? "block" : "none" }}>
                {(Object.values(errors)[0]?.message as string) || ""}
              </div>

              <button type="submit" className="btn-login" disabled={pending}>
                <span className="btn-text">{pending ? "Creating..." : "Create account"}</span>
                <div className="btn-hover-content">
                  <span>{pending ? "Creating..." : "Create account"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </button>

              <Link href="/login" className="btn-google">
                <span className="btn-text">Back to login</span>
                <div className="btn-hover-content">
                  <span>Back to login</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </Link>
            </form>

            <div className="signup-link">Create your account once, then submit reimbursement requests and track results from the employee workspace.</div>
          </div>
        </section>
      </div>
    </main>
  );
}
