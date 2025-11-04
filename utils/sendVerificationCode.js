import { generateEmailOTPTemplate } from "./emailTemplate.js";
import { sendEmail } from "./sendEmail.js";

export async function sendVerificationCode(verificationCode,email,res){
    try{
        const message=generateEmailOTPTemplate(verificationCode);
        sendEmail({
            email,
            subject:"Verification Code (Range Of Himalayas)",
            message
        })
        res.status(200).json({
            success:true,
            message:"VerificationCode send successfully"
        })
    }
    catch(error){
        res.status(200).json({
            success:true,
            message:"VerificationCode failed to send "
        })
    }
}