package com.ChatApplication.TwoFactorAuth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SmsService {
    @Value("${twilio.account.sid}")
    private String Account_SID;

    @Value("${twilio.auth.token}")
    private String AUTH_TOKEN;

    @Value("${twilio.verify.service.sid}")
    private String VERIFY_SERVICE_SID;
}
