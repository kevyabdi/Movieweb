import { Router, type IRouter } from "express";
import healthRouter from "./health";
import moviesRouter from "./movies";
import seriesRouter from "./series";
import seasonsRouter from "./seasons";
import episodesRouter from "./episodes";
import categoriesRouter from "./categories";
import statsRouter from "./stats";
import tmdbRouter from "./tmdb";
import authRouter from "./auth";
import usersRouter from "./users";
import bannersRouter from "./banners";
import analyticsRouter from "./analytics";
import bulkRouter from "./bulk";
import plansRouter from "./plans";
import tmdbImportRouter from "./tmdb-import";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(moviesRouter);
router.use(seriesRouter);
router.use(seasonsRouter);
router.use(episodesRouter);
router.use(categoriesRouter);
router.use(statsRouter);
router.use(tmdbRouter);
router.use(usersRouter);
router.use(bannersRouter);
router.use(analyticsRouter);
router.use(bulkRouter);
router.use(plansRouter);
router.use(tmdbImportRouter);

export default router;
