import express from "express"
import { comparePassword, hashPassword } from "../helpers/brcypt.helper.js"
import { isAuth } from "../middlewares/authMiddleware.js"
import {
  createUser,
  getUserByEmail,
  getUserById,
  updateUserInfo,
} from "../models/User/UserModel.js"

const router = express.Router()

// get User
router.get("/", async (req, res, next) => {
  try {
    const user = await getUserById(req.headers.authorization)
    user.password = undefined
    res.json(user)
  } catch (error) {
    next(error)
  }
})

// Create user

router.post("/", async (req, res, next) => {
  const { email } = req.body

  try {
    const userExists = await getUserByEmail(email)
    if (userExists) {
      return res.json({
        status: "error",
        message: "User already exists! Please log in.",
      })
    }

    // encrypt password
    const hashPass = hashPassword(req.body.password)

    if (hashPass) {
      req.body.password = hashPass
      const user = await createUser(req.body)

      if (user?._id) {
        return res.json({
          status: "success",
          message: "User has been created successfully!",
        })
      }
      return res.json({
        status: "error",
        message: "User not created. Please try again!",
      })
    }
  } catch (error) {
    next(error)
  }
})

// login user
router.post("/login", async (req, res, next) => {
  try {
    const { email } = req.body
    const user = await getUserByEmail(email)

    if (user?._id) {
      // Check if password is valid

      const isPassMatch = comparePassword(req.body.password, user.password)

      if (isPassMatch) {
        user.password = undefined

        return res.json({
          status: "success",
          message: "Login Successful",
          user,
        })
      }
      res.json({
        status: "error",
        message: "Email or Password is wrong!",
      })
    } else {
      res.json({
        status: "error",
        message: "User not found!",
      })
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

// update password
router.patch("/password-update", isAuth, async (req, res, next) => {
  try {
    const user = await getUserById(req.headers.authorization)
    const { currentPassword } = req.body

    const passMatched = comparePassword(currentPassword, user?.password)
    if (passMatched) {
      const hashedPass = hashPassword(req.body.password)

      if (hashedPass) {
        const u = await updateUserInfo(
          { _id: user._id },
          { password: hashedPass }
        )

        if (u?._id) {
          return res.json({
            status: "success",
            message: "Password updated successfully!",
          })
        }
        return res.json({
          status: "error",
          message: "Unable to update password!",
        })
      }
    }
    return res.json({
      status: "error",
      message: "Please enter the correct current password!",
    })
  } catch (error) {
    next(error)
  }
})

// edit details
router.put("/", isAuth, async (req, res, next) => {
  try {
    const { authorization } = req.headers

    const updatedUsers = await updateUserInfo({ _id: authorization }, req.body)

    if (updatedUsers?._id) {
      return res.json({
        status: "success",
        message: "User info updated successfully!",
      })
    }
    return res.json({
      status: "error",
      message: "Unable to update your details!",
    })
  } catch (error) {
    next(error)
  }
})

export default router
