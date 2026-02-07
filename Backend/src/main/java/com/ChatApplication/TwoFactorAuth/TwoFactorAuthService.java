    package com.ChatApplication.TwoFactorAuth;

    import com.twilio.Twilio;
    import com.twilio.rest.verify.v2.service.Verification;
    import com.twilio.rest.verify.v2.service.VerificationCheck;
    import jakarta.annotation.PostConstruct;
    import org.springframework.beans.factory.annotation.Value;
    import org.springframework.stereotype.Service;

    @Service
    public class TwoFactorAuthService {
        @Value("${twilio.account.sid}")
        private String ACCOUNT_SID;

        @Value("${twilio.auth.token}")
        private String AUTH_TOKEN;

        @Value("${twilio.verify.service.sid}")
        private String VERIFY_SERVICE_SID;

        private boolean initialized = false;

        private synchronized void initializeTwilio() {
            if (!initialized) {
                System.out.println("Initializing Twilio with SID: " + ACCOUNT_SID);
                System.out.println("Auth Token length: " + (AUTH_TOKEN != null ? AUTH_TOKEN.length() : "null"));
                System.out.println("Verify Service SID: " + VERIFY_SERVICE_SID);

                if (ACCOUNT_SID == null || AUTH_TOKEN == null) {
                    System.err.println("Twilio credentials are null!");
                    return;
                }

                Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
                initialized = true;
                System.out.println("Twilio initialized successfully");
            }
        }
        public String formatPhoneNumber(String phoneNumber){
            if(phoneNumber == null) return phoneNumber;
            if(!phoneNumber.startsWith("+")){
                return "+977" + phoneNumber;
            }
            return phoneNumber;
        }
        public boolean initiateVerification(String phoneNumber){
            initializeTwilio();
            try{
                String formattedPhoneNumber = formatPhoneNumber(phoneNumber);
                System.out.println("Sending verification to: " + formattedPhoneNumber);
                System.out.println("Using Service SID: " + VERIFY_SERVICE_SID);
                Verification verification = Verification.creator(
                        VERIFY_SERVICE_SID,
                        formattedPhoneNumber,
                        "sms"
                ).create();
                System.out.println("Verification created with status: " + verification.getStatus());
                return verification.getStatus().equals("pending");
            }catch (Exception e) {
                System.err.println("Error in initiate verification:");
                System.err.println("Error message: " + e.getMessage());
                if (e instanceof com.twilio.exception.ApiException) {
                    com.twilio.exception.ApiException apiException = (com.twilio.exception.ApiException) e;
                    System.err.println("Status Code: " + apiException.getStatusCode());
                    System.err.println("Error Code: " + apiException.getCode());
                    System.err.println("More Info: " + apiException.getMoreInfo());
                }
                e.printStackTrace();
                return false;
            }
        }
        public boolean verifyCode(String phoneNumber, String verificationCode) {
            try {
                String formattedPhoneNumber = formatPhoneNumber(phoneNumber);
                VerificationCheck verificationCheck = VerificationCheck.creator(VERIFY_SERVICE_SID)
                        .setTo(formattedPhoneNumber)
                        .setCode(verificationCode)
                        .create();
                return verificationCheck.getStatus().equals("approved");
            } catch (Exception e) {
                System.out.println(e.getMessage());
                return false;
            }
        }


    }
