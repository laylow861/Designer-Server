import { Request, Response } from "express";

class DefaultController {
  static getLoginPage = async(req: Request, res: Response) => {
    res.render("login");
  }

  static getHome = async(req: Request, res: Response) => {
    res.render("home", {
      current_user: req.user
    })
  }
}

export default DefaultController;