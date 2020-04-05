import auth0 from "../../lib/auth0";
import { NextApiResponse, NextApiRequest } from "next";

export default async function me(req: NextApiRequest, res: NextApiResponse) {
  try {
    await auth0.handleProfile(req, res);
  } catch (error) {
    res.status(error.status || 500).end(error.message);
  }
}
