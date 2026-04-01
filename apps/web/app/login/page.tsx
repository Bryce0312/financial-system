"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, type CSSProperties } from "react";
import { useForm } from "react-hook-form";

import { RoleCode, loginSchema, type LoginInput } from "@financial-system/types";

import { apiFetch } from "@/lib/api";
import { writeSession, type SessionState } from "@/lib/auth";

type Stage = "idle" | "account" | "password-hide" | "password-show" | "error" | "submitting";

export default function LoginPage() {
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
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  const username = watch("username");
  const password = watch("password");

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
    if (!errors.password?.message) return;

    setStage("error");
    setErrorVisible(true);
    const timer = window.setTimeout(() => {
      setStage(password ? (showPassword ? "password-show" : "password-hide") : username ? "account" : "idle");
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [errors.password?.message, password, showPassword, username]);

  const usernameField = register("username");
  const passwordField = register("password");

  const sceneStyle = useMemo(() => {
    const dx = (mouse.x - 0.5) * 10;
    const dy = (mouse.y - 0.5) * 8;

    const away = {
      "--purple-skew": "-14deg",
      "--purple-shift": "-20px",
      "--purple-height": "410px",
      "--purple-eyes-left": "20px",
      "--purple-eyes-top": "25px",
      "--purple-pupil-x": "-5px",
      "--purple-pupil-y": "-5px",
      "--black-skew": "12deg",
      "--black-shift": "-10px",
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
      "--purple-skew": `${-12 + dx * 0.1}deg`,
      "--purple-shift": "40px",
      "--purple-height": "410px",
      "--purple-eyes-left": "55px",
      "--purple-eyes-top": "65px",
      "--purple-pupil-x": "3px",
      "--purple-pupil-y": "4px",
      "--black-skew": `${10 + dx * 0.1}deg`,
      "--black-shift": "20px",
      "--black-eyes-left": "32px",
      "--black-eyes-top": "12px",
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
        const session = await apiFetch<SessionState>("/auth/login", {
          method: "POST",
          body: JSON.stringify(values)
        });
        writeSession(session);
        router.push(session.user.roles.includes(RoleCode.ADMIN) ? "/admin" : "/employee/dashboard");
      } catch (error) {
        setErrorVisible(true);
        setError("password", {
          message: error instanceof Error ? error.message : "Login failed. Please try again."
        });
      }
    });
  });

  return (
    <main className="auth-playful-page">
      <div className="auth-playful-shell" id="login-page">
        <section
          className={`left-panel ${stage === "error" ? "is-error" : ""}`}
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
              <h2>Smart Reimbursement System</h2>
              <p>Submit claims, upload invoices, review anomaly flags, and export monthly reports in one place.</p>
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
            <span>Claims Intake</span>
            <span>Rule Checks</span>
            <span>Admin Review</span>
            <span>Monthly Export</span>
          </div>
        </section>

        <section className="right-panel">
          <div className="form-container">
            <div className="sparkle-icon">
              <div className="sparkle-mark" aria-hidden="true">$</div>
            </div>

            <div className="form-header">
              <h1>Welcome back!</h1>
              <p>Employee and admin access for claims, attachments, review, and export.</p>
            </div>

            <form onSubmit={submit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div className="input-wrapper">
                  <input
                    {...usernameField}
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="employee or admin"
                    className={errors.username ? "error" : ""}
                    onFocus={() => setStage("account")}
                    onBlur={() => setStage(password ? (showPassword ? "password-show" : "password-hide") : "idle")}
                  />
                </div>
                <div className="field-note">Use your employee or administrator username.</div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <input
                    {...passwordField}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={errors.password ? "error" : ""}
                    onFocus={() => setStage(showPassword ? "password-show" : "password-hide")}
                    onBlur={() => setStage(username ? "account" : "idle")}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => {
                      setShowPassword((value) => !value);
                      setStage(!showPassword ? "password-show" : "password-hide");
                    }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="field-note">Password hidden: characters look away. Password shown: they peek back.</div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" defaultChecked /> Remember for 30 days
                </label>
                <span className="forgot-link">Employee & Admin Access</span>
              </div>

              <div className="error-msg" style={{ display: errorVisible || errors.password ? "block" : "none" }}>
                {(errors.password?.message as string) || ""}
              </div>

              <button type="submit" className="btn-login" disabled={pending}>
                <span className="btn-text">{pending ? "Signing in..." : "Log In"}</span>
                <div className="btn-hover-content">
                  <span>{pending ? "Signing in..." : "Log In"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </button>

              <Link href="/register" className="btn-google btn-google--secondary">
                <span className="btn-text">Create employee account</span>
                <div className="btn-hover-content">
                  <span>Sign Up</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </Link>
            </form>

            <div className="signup-link">Reimbursement, attachment review, anomaly checks, and export in one place.</div>
          </div>
        </section>
      </div>
    </main>
  );
}
