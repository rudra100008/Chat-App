"use client";
import { useRouter, useSearchParams } from "next/navigation";
import style from "../Style/loginPhone.module.css";
import { useState } from "react";
import { initiatePhoneLogin } from "../services/loginPhoneService";
import { useNotification } from "../context/NotificationContext";
import Message from "./../Component/chat/Message";
export default function LoginPhone() {
  const router = useRouter();
  const { success, error, clear } = useNotification();
  const [userData, setUserData] = useState({
    phoneNumber: "",
    countryCode: "+977",
  });
  const countries = [
    { name: "India", code: "+91", value: "IN" },
    { name: "Nepal", code: "+977", value: "NP" },
    { name: "United States", code: "+1", value: "US" },
    { name: "United Kingdom", code: "+44", value: "GB" },
    { name: "Australia", code: "+61", value: "AU" },
  ];

  const handleCountryChange = (e) => {
    const selectedCountry = countries.find(
      (country) => country.value === e.target.value
    );
    setUserData((prev) => ({
      ...prev,
      countryCode: selectedCountry.code,
    }));
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };
  const handleCancel = () => {
    router.push("/");
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const request={
        phoneNumber:userData.countryCode + userData.phoneNumber
      }
      console.log("PhoneNumber: ",request.phoneNumber);
      const data = await initiatePhoneLogin(request);
      
      const { message, phoneNumber } = data;
      success(message);
      setUserData({
        phoneNumber: phoneNumber,
        countryCode: "",
      });
    } catch (err) {
      console.log("Error in handleSubmit: ", err.response.data);
    }
  };
  return (
    <div className={style.container}>
      <div className={style.header}>
        <h3>Enter Phone Number</h3>
        <span>Select a country and enter your phone number.</span>
      </div>

      <div className={style.formContainer}>
        <form onSubmit={handleSubmit}>
          <div className={style.formGroup}>
            <select
              className={style.countrySelect}
              onChange={handleCountryChange}
              defaultValue="NP"
            >
              {countries.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.name}
                </option>
              ))}
            </select>
            <div className={style.InputGroup}>
              <input
                name="phoneNumber"
                id="phoneNumber"
                value={userData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Enter phoneNumber"
              />
            </div>

            <div className={style.ActionGroup}>
              <div onClick={handleCancel} className={style.subActionGroup}>
                <button className={style.cancelButton} type="button">
                  Cancel
                </button>
              </div>
              <div className={style.subActionGroup}>
                <button className={style.submitButton} type="submit">
                  Next
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
