import { Router, type IRouter } from "express";
import healthRouter from "./health";
import siteRouter from "./site";
import inquiriesRouter from "./inquiries";
import adminRouter from "./admin";
import storageRouter from "./storage";
import seoRouter from "./seo";
import tableroRouter from "./tablero";

const router: IRouter = Router();

router.use(healthRouter);
router.use(siteRouter);
router.use(inquiriesRouter);
router.use(adminRouter);
router.use(storageRouter);
router.use(seoRouter);
router.use(tableroRouter);

export default router;
