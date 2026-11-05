import { Config } from "@remotion/cli/config";
// Apple Silicon: ANGLE runs WebGL on Metal (the M-series GPU). Use "swangle" only on machines without a GPU.
Config.setChromiumOpenGlRenderer("angle");
Config.setVideoImageFormat("jpeg");
Config.setConcurrency(4);
