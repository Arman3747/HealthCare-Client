/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import z from "zod";
import { parse } from "cookie";
import { redirect } from "next/navigation";
import jwt, { JwtPayload } from "jsonwebtoken";
import {
  getDefaultDashboardRoute,
  isValidRedirectForRole,
  UserRole,
} from "@/lib/auth-utils";
import { setCookie } from "./tokenHandlers";

const loginValidationZodSchema = z.object({
  email: z.email({
    message: "Email is required",
  }),
  password: z
    .string("Password is required")
    .min(6, {
      error: "Password is required and must be at least 6 characters long",
    })
    .max(100, {
      error: "Password must be at most 100 characters long",
    }),
});

export const loginUser = async (
  _currentState: any,
  formData: any,
): Promise<any> => {
  try {
    const redirectTo = formData.get("redirect") || null;
    let accessTokenObject: null | any = null;
    let refreshTokenObject: null | any = null;

    const loginData = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const validatedFields = loginValidationZodSchema.safeParse(loginData);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.issues.map((issue) => {
          return {
            field: issue.path[0],
            message: issue.message,
          };
        }),
      };
    }

    const res = await fetch("http://localhost:5000/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(loginData),
      headers: {
        "Content-Type": "application/json",
      },
    });

    // console.log(res);
    const result = await res.json();

    const setCookieHeaders = res.headers.getSetCookie();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((cookie: string) => {
        // console.log(cookie, "for each cookie");
        const parsedCookie = parse(cookie);
        // console.log(parsedCookie);

        if (parsedCookie["accessToken"]) {
          accessTokenObject = parsedCookie;
        }
        if (parsedCookie["refreshToken"]) {
          refreshTokenObject = parsedCookie;
        }
      });
    } else {
      throw new Error("No Set-Cookie header found!");
    }
    // console.log(setCookieHeaders);

    // console.log({ accessTokenObject, refreshTokenObject });

    if (!accessTokenObject) {
      throw new Error("accessTokenObject not found in cookies");
    }
    if (!refreshTokenObject) {
      throw new Error("refreshTokenObject not found in cookies");
    }

    // console.log(refreshTokenObject);
    /**
     *  {

  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkcmlhbkBlbWFpbC5jb20iLCJyb2xlIjoiUEFUSUVOVCIsImlhdCI6MTc3NDUyNTcxNCwiZXhwIjoxNzc3MTE3NzE0fQ.89wja7hkNwBH7TisWM601dTaLHaV29OMg3D5iYTr8t8',
  'Max-Age': '2592000',
  Path: '/',
  Expires: 'Sat, 25 Apr 2026 11:48:34 GMT',
  SameSite: 'None'
}
    */
    // const cookieStore = await cookies();

    await setCookie("accessToken", accessTokenObject.accessToken, {
      secure: true,
      httpOnly: true,
      maxAge: parseInt(accessTokenObject["Max-Age"]) || 12 * 1000 * 60 * 60,
      path: accessTokenObject.Path || "/",
      sameSite: accessTokenObject["SameSite"] || "none",
    });

    await setCookie("refreshToken", refreshTokenObject.refreshToken, {
      secure: true,
      httpOnly: true,
      maxAge: parseInt(refreshTokenObject["Max-Age"]) || 24 * 1000 * 60 * 60,
      path: refreshTokenObject.Path || "/",
      sameSite: accessTokenObject["SameSite"] || "none",
    });

    const verifiedToken: JwtPayload | string = jwt.verify(
      accessTokenObject.accessToken,
      process.env.ACCESS_TOKEN_SECRET as string,
    );
    if (typeof verifiedToken === "string") {
      throw new Error("Invalid token");
    }

    //`${process.env.NODE_ENV === "development" ? result.message : "Login failed. You might have given incorrect email or password."}`

    const userRole: UserRole = verifiedToken.role;

    if (!result.success) {
      throw new Error(result.message || "Login failed");
    }

    if (redirectTo) {
      const requestedPath = redirectTo.toString();
      if (isValidRedirectForRole(requestedPath, userRole)) {
        redirect(`${requestedPath}?loggedIn=true`);
      } else {
        redirect(`${getDefaultDashboardRoute(userRole)}?loggedIn=true`);
      }
    } else {
      redirect(`${getDefaultDashboardRoute(userRole)}?loggedIn=true`);
    }

    // const redirectPath = redirectTo
    //   ? redirectTo.toString()
    //   : getDefaultDashboardRoute(userRole);
    // redirect(redirectPath);

    // return result;
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.log(error);
    return {
      success: false,
      message: `${process.env.NODE_ENV === "development" ? error.message : "Login failed. You might have entered incorrect email or password."}`,
    };
  }
};
