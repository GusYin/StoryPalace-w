import { type ActionCodeSettings, type Auth } from "firebase/auth";
import { getAuth, sendSignInLinkToEmail } from "firebase/auth";

const actionCodeSettings = {
  url: "https://www.example.com/?email=",
  iOS: {
    bundleId: "com.example.ios",
  },
  android: {
    packageName: "com.example.android",
  },
  handleCodeInApp: true,
  // Specify a custom Hosting link domain to use. The domain must be
  // configured in Firebase Hosting and owned by the project.
  //linkDomain: "custom-domain.com",
} satisfies ActionCodeSettings;

const auth = getAuth();

const sendSignInLink = (
  auth: Auth,
  email: string,
  actionCodeSettings: ActionCodeSettings
) =>
  sendSignInLinkToEmail(auth, email, actionCodeSettings)
    .then(() => {
      // The link was successfully sent. Inform the user.
      // Save the email locally so you don't need to ask the user for it again
      // if they open the link on the same device.
      window.localStorage.setItem("emailForSignIn", email);
      // ...
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      // ...
    });
