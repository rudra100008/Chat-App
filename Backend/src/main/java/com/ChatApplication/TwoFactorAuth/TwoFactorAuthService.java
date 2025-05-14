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

    @PostConstruct
    public void init(){
        Twilio.init(ACCOUNT_SID,AUTH_TOKEN);
    }
    public String formatPhoneNumber(String phoneNumber){
        if(!phoneNumber.startsWith("+")){
            return "+977" + phoneNumber;
        }
        return phoneNumber;
    }
    public boolean initiateVerification(String phoneNumber){
        try{
            String formattedPhoneNumber = formatPhoneNumber(phoneNumber);
            Verification verification = Verification.creator(
                    VERIFY_SERVICE_SID,
                    formattedPhoneNumber,
                    "sms"
            ).create();
            return verification.getStatus().equals("pending");
        }catch (Exception e){
            System.out.println(e.getMessage());
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
