"use client";
import { useRouter } from "next/navigation";
import axiosInterceptor from "../Component/Interceptor";
import baseUrl from "../baseUrl";
import styles from "../Style/SigupPage.module.css";
import { useState } from "react";
import Link from "next/link";
import RoutePath from "../Component/RoutePath";

export default function SignUp() {
  const router = useRouter();
  const [localLoading, setLocalLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [validationError, setValidationError] = useState({
    username: "",
    email: "",
    password: "",
    phoneNumber: "",
    message: "",
  });
  const [userInfo, setUserInfo] = useState({
    username: "",
    email: "",
    password: "",
    phoneNumber: "",
    image: null,
  });

  const newUser = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({ ...prev, [name]: value }));
    // setValidationError((prev)=>({...prev,[name]:"",[message]:""}))
  };
  const handleSignUpForm = async () => {
    setLocalLoading(true);
    const formData = new FormData();
    formData.append(
      "user",
      new Blob(
        [
          JSON.stringify({
            username: userInfo.username,
            email: userInfo.email,
            password: userInfo.password,
            phoneNumber: userInfo.phoneNumber,
          }),
        ],
        { type: "application/json" },
      ),
    );
    if (userInfo.image) {
      formData.append("image", userInfo.image);
    }
    try {
      const response = await axiosInterceptor.post(`/auth/signup`, formData);
      console.log("UserInfo: ", userInfo);
      console.log(response.data);
      router.push("/");
    } catch (error) {
      console.log(error.response.data);
      if (error.response?.status === 400) {
        // Handle validation errors from backend
        const errorData = error.response.data;
        setValidationError((prev) => ({
          ...prev,
          ...errorData,
        }));
      } else if (error.response?.status === 409) {
        // Handle conflict error (e.g., email already exists)
        setValidationError((prev) => ({
          ...prev,
          message: error.response.data.message,
        }));
      } else if (error.response?.status === 500) {
        setValidationError((prev) => ({
          ...prev,
          message: error.response.data.message,
        }));
      } else {
        setValidationError((prev) => ({
          ...prev,
          message: "An unexpected error occurred. Please try again.",
        }));
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUserInfo({ ...userInfo, image: file });

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setUserInfo({ ...userInfo, image: null });
    setImagePreview(null);
  };

  const handleForm = (e) => {
    e.preventDefault();
    handleSignUpForm();
  };

  if (validationError.message) {
    return <div>{validationError.message}</div>;
  }
  return (
    <RoutePath>
      <div className={styles.pageContainer}>
        <div className={styles.backgroundShapes}>
          <div className={styles.shape1}></div>
          <div className={styles.shape2}></div>
          <div className={styles.shape3}></div>
          <div className={styles.shape4}></div>
        </div>

        <div className={styles.signupWrapper}>
          <div className={styles.illustrationSide}>
            <div className={styles.brandContent}>
              <div className={styles.logoContainer}>
                <div className={styles.logoCircle}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                </div>
              </div>
              <h1 className={styles.brandTitle}>Join Us Today!</h1>
              <p className={styles.brandDescription}>
                Create your account and start your amazing journey with us
              </p>

              <div className={styles.illustrationGraphic}>
                <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
                  <circle
                    cx="150"
                    cy="120"
                    r="30"
                    fill="currentColor"
                    opacity="0.2"
                  />
                  <rect
                    x="135"
                    y="150"
                    width="30"
                    height="50"
                    rx="5"
                    fill="currentColor"
                    opacity="0.3"
                  />

                  <circle
                    cx="250"
                    cy="120"
                    r="30"
                    fill="currentColor"
                    opacity="0.2"
                  />
                  <rect
                    x="235"
                    y="150"
                    width="30"
                    height="50"
                    rx="5"
                    fill="currentColor"
                    opacity="0.3"
                  />

                  <rect
                    x="120"
                    y="220"
                    width="160"
                    height="40"
                    rx="8"
                    fill="currentColor"
                    opacity="0.15"
                  />

                  <circle
                    cx="80"
                    cy="50"
                    r="8"
                    fill="currentColor"
                    opacity="0.2"
                  />
                  <circle
                    cx="320"
                    cy="60"
                    r="10"
                    fill="currentColor"
                    opacity="0.15"
                  />
                  <circle
                    cx="100"
                    cy="250"
                    r="6"
                    fill="currentColor"
                    opacity="0.2"
                  />
                  <circle
                    cx="300"
                    cy="240"
                    r="7"
                    fill="currentColor"
                    opacity="0.15"
                  />
                </svg>
              </div>

              {/* Feature Points */}
              <div className={styles.featurePoints}>
                <div className={styles.featurePoint}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Free Account</span>
                </div>
                <div className={styles.featurePoint}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>No Credit Card</span>
                </div>
                <div className={styles.featurePoint}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Quick Setup</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - SignUp Form */}
          <div className={styles.formSide}>
            <div className={styles.formContainer}>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>Create Account</h2>
                <p className={styles.formSubtitle}>
                  Fill in your details to get started
                </p>
              </div>

              {validationError.message && (
                <div className={styles.errorAlert}>
                  <svg
                    className={styles.errorIcon}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{validationError.message}</span>
                </div>
              )}

              <form onSubmit={handleForm} className={styles.form}>
                {/* Profile Image Upload */}
                <div className={styles.imageUploadSection}>
                  <div className={styles.imageUploadWrapper}>
                    {imagePreview ? (
                      <div className={styles.imagePreviewContainer}>
                        <img
                          src={imagePreview}
                          alt="Profile preview"
                          className={styles.imagePreview}
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className={styles.removeImageButton}
                          aria-label="Remove image"
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="image"
                        className={styles.imageUploadLabel}
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Upload Photo</span>
                        <span className={styles.uploadHint}>Optional</span>
                      </label>
                    )}
                    <input
                      type="file"
                      name="image"
                      id="image"
                      onChange={handleFileChange}
                      className={styles.fileInput}
                      accept="image/*"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="username" className={styles.label}>
                      Username
                    </label>
                    <div className={styles.inputWrapper}>
                      <svg
                        className={styles.inputIcon}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={userInfo.username}
                        onChange={newUser}
                        placeholder="Enter username"
                        className={styles.input}
                        required
                      />
                    </div>
                    {validationError.username && (
                      <p className={styles.fieldError}>
                        {validationError.username}
                      </p>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>
                      Email
                    </label>
                    <div className={styles.inputWrapper}>
                      <svg
                        className={styles.inputIcon}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={userInfo.email}
                        onChange={newUser}
                        placeholder="Enter email"
                        className={styles.input}
                        required
                      />
                    </div>
                    {validationError.email && (
                      <p className={styles.fieldError}>
                        {validationError.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="phoneNumber" className={styles.label}>
                      Phone Number
                    </label>
                    <div className={styles.inputWrapper}>
                      <svg
                        className={styles.inputIcon}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      <input
                        type="text"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={userInfo.phoneNumber}
                        onChange={newUser}
                        placeholder="Enter phone number"
                        className={styles.input}
                        required
                      />
                    </div>
                    {validationError.phoneNumber && (
                      <p className={styles.fieldError}>
                        {validationError.phoneNumber}
                      </p>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="password" className={styles.label}>
                      Password
                    </label>
                    <div className={styles.inputWrapper}>
                      <svg
                        className={styles.inputIcon}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={userInfo.password}
                        onChange={newUser}
                        placeholder="Enter password"
                        className={styles.input}
                        required
                      />
                      <button
                        type="button"
                        className={styles.togglePassword}
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <svg viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                              clipRule="evenodd"
                            />
                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                              fillRule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                    {validationError.password && (
                      <p className={styles.fieldError}>
                        {validationError.password}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={localLoading}
                >
                  {localLoading ? (
                    <>
                      <svg className={styles.spinner} viewBox="0 0 24 24">
                        <circle
                          className={styles.spinnerCircle}
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                      </svg>
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <svg
                        className={styles.buttonIcon}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </>
                  )}
                </button>

                <div className={styles.divider}>
                  <span>or</span>
                </div>

                <div className={styles.loginPrompt}>
                  <p>
                    Already have an account?{" "}
                    <Link href="/" className={styles.loginLink}>
                      Sign In
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </RoutePath>
  );
}
