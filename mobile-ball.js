/* ODERZHIMYE v56.3.0 - persistent mobile globe renderer.
 * One WebGL canvas, four immutable textures and one animation clock.
 * No video decoder, media autoplay, CSS-3D scene swaps or frame-time downloads.
 * The shell, glass and die materials are baked from the existing application.
 */
(() => {
  'use strict';
  const MIX = 1720, DARK = 165, RISE = 1080, TOTAL = MIX + DARK + RISE;
  const FACES = [[0,0],[0,-90],[-90,0],[0,90],[90,0],[0,180]];
  const FILES = ['ball-mobile-back.webp','ball-mobile-front.webp','ball-mobile-faces.webp','ball-mobile-resin.webp'];
  const ROOT = new URL('assets/', document.currentScript?.src || document.baseURI);
  let imagesPromise = null;
  const clamp = (x,a=0,b=1) => Math.max(a,Math.min(b,x));
  const lerp = (a,b,t) => a+(b-a)*t;
  const radians = Math.PI/180;
  const BODY_DESKTOP = [[0.0,0.0,0.0,0.0,1.0],[0.007576,0.0,0.0,0.0,1.0],[0.015152,0.0,-0.0031,0.0,1.00002],[0.022727,0.0,-0.0297,0.0,1.00018],[0.030303,0.0,-0.1003,0.0,1.00059],[0.037879,0.0,-0.2275,0.0,1.00135],[0.045454999999999995,0.0,-0.4172,0.0,1.00248],[0.05303,0.0,-0.6691,0.0,1.00397],[0.060606,0.0,-0.9782,0.0,1.0058],[0.068182,0.0,-1.3351,0.0,1.00792],[0.075758,0.0,-1.7276,0.0,1.01025],[0.08333299999999999,0.0,-2.1409,0.0,1.0127],[0.09090899999999999,0.0,-2.5595,0.0,1.01519],[0.09848499999999999,0.0,-2.9671,0.0,1.01761],[0.106061,0.0,-3.3483,0.0,1.01987],[0.113636,0.0,-3.6893,0.0,1.02189],[0.121212,-0.0547,-3.9789,-0.0047,1.02361],[0.128788,-0.4483,-4.2118,-0.0381,1.02496],[0.136364,-1.013,-4.3844,-0.0861,1.02595],[0.143939,-1.4285,-4.4921,-0.1214,1.02664],[0.151515,-1.4457,-4.5331,-0.2406,1.02713],[0.159091,-0.9087,-4.5138,-0.5377,1.02755],[0.16666699999999998,0.1587,-4.4546,-0.8221,1.02803],[0.17424199999999998,1.6617,-4.3766,-0.8889,1.02858],[0.18181799999999998,3.4672,-4.2962,-0.6037,1.02909],[0.18939399999999998,5.4152,-4.2348,0.0821,1.02944],[0.19696999999999998,7.3331,-4.2131,1.1091,1.02952],[0.204545,9.0508,-4.245,2.3864,1.02925],[0.212121,10.4162,-4.3327,3.8008,1.02864],[0.219697,11.3083,-4.4656,5.2269,1.02774],[0.227273,11.6479,-4.6226,6.5384,1.02668],[0.234848,11.1651,-4.7783,7.5986,1.02559],[0.242424,9.5761,-4.9099,8.2858,1.02461],[0.25,7.0283,-5.0024,8.5396,1.02382],[0.257576,3.7612,-5.0468,8.3199,1.02328],[0.265152,0.0819,-5.0385,7.367,1.02302],[0.272727,-3.6639,-4.9782,5.6762,1.02307],[0.280303,-7.124,-4.8724,3.4063,1.02342],[0.287879,-9.9734,-4.7323,0.7708,1.02404],[0.295455,-11.9441,-4.5728,-1.9827,1.0249],[0.30303,-12.8509,-4.411,-4.5953,1.02591],[0.310606,-12.6512,-4.2639,-6.8252,1.02701],[0.318182,-11.4783,-4.1472,-8.4725,1.02811],[0.325758,-9.4322,-4.0733,-9.3815,1.02912],[0.333333,-6.675,-4.0501,-9.4648,1.02997],[0.34090899999999996,-3.4249,-4.08,-8.7795,1.03059],[0.348485,0.0607,-4.1599,-7.4267,1.03094],[0.35606099999999996,3.5059,-4.2813,-5.5135,1.03098],[0.36363599999999996,6.6379,-4.4312,-3.1913,1.03071],[0.37121200000000004,9.2087,-4.5937,-0.6442,1.03016],[0.37878799999999996,11.0148,-4.7516,1.9264,1.02937],[0.38636400000000004,11.9132,-4.8881,4.3169,1.02839],[0.39393900000000004,11.8498,-4.9886,6.3393,1.02731],[0.401515,10.9047,-5.0425,7.8401,1.0262],[0.40909100000000004,9.1615,-5.0441,8.7012,1.02515],[0.416667,6.7583,-4.9931,8.8542,1.02425],[0.424242,3.8853,-4.895,8.3203,1.02356],[0.43181800000000004,0.77,-4.7603,7.1783,1.02313],[0.439394,-2.341,-4.6032,5.5185,1.023],[0.44697000000000003,-5.2012,-4.4405,3.4724,1.02318],[0.45454500000000003,-7.5844,-4.2894,1.202,1.02365],[0.462121,-9.3017,-4.166,-1.1129,1.02438],[0.46969700000000003,-10.2173,-4.0834,-3.2891,1.02531],[0.477273,-10.2956,-4.0504,-5.1574,1.02638],[0.484848,-9.7961,-4.0705,-6.5925,1.02749],[0.49242400000000003,-8.802,-4.1416,-7.4844,1.02856],[0.5,-7.3721,-4.2561,-7.7609,1.02951],[0.5075759999999999,-5.5909,-4.4018,-7.4862,1.03027],[0.515152,-3.5635,-4.5633,-6.8315,1.03078],[0.522727,-1.4098,-4.7234,-5.8385,1.03099],[0.530303,0.743,-4.865,-4.5657,1.0309],[0.537879,2.7677,-4.9732,-3.0885,1.03051],[0.545455,4.5447,-5.0364,-1.4941,1.02985],[0.55303,5.9691,-5.0478,0.1234,1.02897],[0.560606,6.9566,-5.0064,1.6683,1.02794],[0.568182,7.4489,-4.9164,3.0495,1.02683],[0.575758,7.4595,-4.7875,4.1888,1.02574],[0.583333,7.1888,-4.6334,5.0361,1.02474],[0.590909,6.6752,-4.4704,5.5433,1.02392],[0.598485,5.9419,-4.3158,5.6797,1.02334],[0.606061,5.0222,-4.1862,5.5212,1.02304],[0.613636,3.9577,-4.0952,5.1766,1.02304],[0.621212,2.7966,-4.0525,4.6617,1.02335],[0.628788,1.5915,-4.0628,3.9996,1.02394],[0.636364,0.397,-4.1248,3.2205,1.02476],[0.643939,-0.7328,-4.232,2.3596,1.02576],[0.651515,-1.7468,-4.373,1.4559,1.02685],[0.659091,-2.5991,-4.5329,0.5503,1.02795],[0.666667,-3.251,-4.6945,-0.3161,1.02899],[0.674242,-3.673,-4.8405,-1.1042,1.02986],[0.6818179999999999,-3.8461,-4.9542,-1.7783,1.0305],[0.6893940000000001,-3.8078,-5.0224,-2.3116,1.03086],[0.69697,-3.6457,-5.0372,-2.6873,1.03089],[0.704545,-3.3694,-4.9977,-2.8887,1.03061],[0.7121210000000001,-2.9917,-4.9103,-2.9087,1.03004],[0.719697,-2.5299,-4.788,-2.8083,1.02925],[0.727273,-2.0054,-4.648,-2.6201,1.02833],[0.7348480000000001,-1.4426,-4.5093,-2.3528,1.02738],[0.7424240000000001,-0.8674,-4.3894,-2.0189,1.0265],[0.75,-0.3064,-4.3019,-1.6337,1.02577],[0.7575759999999999,0.2144,-4.2514,-1.2151,1.02522],[0.7651519999999999,0.671,-4.2328,-0.7824,1.02485],[0.772727,1.0422,-4.2356,-0.3556,1.02464],[0.780303,1.3109,-4.2459,0.0455,1.02452],[0.7878789999999999,1.4646,-4.2484,0.4024,1.02442],[0.795455,1.4983,-4.2284,0.6987,1.02427],[0.80303,1.4572,-4.1747,0.9248,1.02401],[0.8106059999999999,1.3637,-4.0802,1.0719,1.02356],[0.8181820000000001,1.2248,-3.9431,1.1335,1.02291],[0.825758,1.0507,-3.7661,1.1165,1.02203],[0.833333,0.8544,-3.5555,1.0568,1.02093],[0.840909,0.6503,-3.3197,0.9619,1.01965],[0.848485,0.4537,-3.0673,0.8389,1.01822],[0.856061,0.2789,-2.8057,0.6967,1.0167],[0.8636360000000001,0.1391,-2.5409,0.5461,1.01512],[0.871212,0.0444,-2.2767,0.398,1.01354],[0.878788,0.002,-2.0155,0.2635,1.01197],[0.8863639999999999,0.0,-1.7597,0.1512,1.01044],[0.893939,0.0,-1.5115,0.0662,1.00897],[0.901515,0.0,-1.2745,0.0147,1.00756],[0.909091,0.0,-1.0521,0.0,1.00624],[0.916667,0.0,-0.8472,0.0,1.00503],[0.924242,0.0,-0.6624,0.0,1.00393],[0.9318179999999999,0.0,-0.4998,0.0,1.00297],[0.9393940000000001,0.0,-0.3607,0.0,1.00214],[0.94697,0.0,-0.246,0.0,1.00146],[0.954545,0.0,-0.1555,0.0,1.00092],[0.9621210000000001,0.0,-0.0884,0.0,1.00052],[0.969697,0.0,-0.0427,0.0,1.00025],[0.977273,0.0,-0.0157,0.0,1.00009],[0.9848480000000001,0.0,-0.0032,0.0,1.00002],[0.9924240000000001,0.0,-0.0001,0.0,1.0],[1.0,0.0,0.0,0.0,1.0]];
  const BODY_PHONE = [[0.0,0.0,0.0,0.0,1.0],[0.007576,0.0,0.0,0.0,1.0],[0.015152,0.0,-0.0031,0.0,1.00002],[0.022727,0.0,-0.0297,0.0,1.00018],[0.030303,0.0,-0.1003,0.0,1.00059],[0.037879,0.0,-0.2275,0.0,1.00135],[0.045454999999999995,0.0,-0.4172,0.0,1.00248],[0.05303,0.0,-0.6691,0.0,1.00397],[0.060606,0.0,-0.9782,0.0,1.0058],[0.068182,0.0,-1.3351,0.0,1.00792],[0.075758,0.0,-1.7276,0.0,1.01025],[0.08333299999999999,0.0,-2.1409,0.0,1.0127],[0.09090899999999999,0.0,-2.5595,0.0,1.01519],[0.09848499999999999,0.0,-2.9671,0.0,1.01761],[0.106061,0.0,-3.3483,0.0,1.01987],[0.113636,0.0,-3.6893,0.0,1.02189],[0.121212,-0.0493,-3.9789,-0.0045,1.02361],[0.128788,-0.4034,-4.2118,-0.0366,1.02496],[0.136364,-0.9117,-4.3844,-0.0827,1.02595],[0.143939,-1.2857,-4.4921,-0.1166,1.02664],[0.151515,-1.3012,-4.5331,-0.231,1.02713],[0.159091,-0.8178,-4.5138,-0.5162,1.02755],[0.16666699999999998,0.1428,-4.4546,-0.7892,1.02803],[0.17424199999999998,1.4955,-4.3766,-0.8534,1.02858],[0.18181799999999998,3.1205,-4.2962,-0.5796,1.02909],[0.18939399999999998,4.8737,-4.2348,0.0788,1.02944],[0.19696999999999998,6.5998,-4.2131,1.0648,1.02952],[0.204545,8.1457,-4.245,2.291,1.02925],[0.212121,9.3746,-4.3327,3.6488,1.02864],[0.219697,10.1775,-4.4656,5.0179,1.02774],[0.227273,10.4831,-4.6226,6.2769,1.02668],[0.234848,10.0486,-4.7783,7.2946,1.02559],[0.242424,8.6185,-4.9099,7.9543,1.02461],[0.25,6.3255,-5.0024,8.198,1.02382],[0.257576,3.3851,-5.0468,7.9871,1.02328],[0.265152,0.0737,-5.0385,7.0723,1.02302],[0.272727,-3.2975,-4.9782,5.4491,1.02307],[0.280303,-6.4116,-4.8724,3.2701,1.02342],[0.287879,-8.976,-4.7323,0.74,1.02404],[0.295455,-10.7497,-4.5728,-1.9034,1.0249],[0.30303,-11.5658,-4.411,-4.4115,1.02591],[0.310606,-11.3861,-4.2639,-6.5522,1.02701],[0.318182,-10.3305,-4.1472,-8.1336,1.02811],[0.325758,-8.489,-4.0733,-9.0062,1.02912],[0.333333,-6.0075,-4.0501,-9.0862,1.02997],[0.34090899999999996,-3.0824,-4.08,-8.4283,1.03059],[0.348485,0.0547,-4.1599,-7.1296,1.03094],[0.35606099999999996,3.1553,-4.2813,-5.2929,1.03098],[0.36363599999999996,5.9741,-4.4312,-3.0637,1.03071],[0.37121200000000004,8.2879,-4.5937,-0.6184,1.03016],[0.37878799999999996,9.9133,-4.7516,1.8494,1.02937],[0.38636400000000004,10.7218,-4.8881,4.1442,1.02839],[0.39393900000000004,10.6648,-4.9886,6.0858,1.02731],[0.401515,9.8142,-5.0425,7.5265,1.0262],[0.40909100000000004,8.2453,-5.0441,8.3531,1.02515],[0.416667,6.0824,-4.9931,8.5001,1.02425],[0.424242,3.4967,-4.895,7.9875,1.02356],[0.43181800000000004,0.693,-4.7603,6.8911,1.02313],[0.439394,-2.1069,-4.6032,5.2977,1.023],[0.44697000000000003,-4.6811,-4.4405,3.3335,1.02318],[0.45454500000000003,-6.8259,-4.2894,1.1539,1.02365],[0.462121,-8.3715,-4.166,-1.0684,1.02438],[0.46969700000000003,-9.1955,-4.0834,-3.1576,1.02531],[0.477273,-9.266,-4.0504,-4.9511,1.02638],[0.484848,-8.8165,-4.0705,-6.3288,1.02749],[0.49242400000000003,-7.9218,-4.1416,-7.185,1.02856],[0.5,-6.6349,-4.2561,-7.4505,1.02951],[0.5075759999999999,-5.0318,-4.4018,-7.1867,1.03027],[0.515152,-3.2072,-4.5633,-6.5582,1.03078],[0.522727,-1.2688,-4.7234,-5.6049,1.03099],[0.530303,0.6687,-4.865,-4.3831,1.0309],[0.537879,2.4909,-4.9732,-2.965,1.03051],[0.545455,4.0903,-5.0364,-1.4343,1.02985],[0.55303,5.3722,-5.0478,0.1185,1.02897],[0.560606,6.2609,-5.0064,1.6016,1.02794],[0.568182,6.704,-4.9164,2.9275,1.02683],[0.575758,6.7136,-4.7875,4.0212,1.02574],[0.583333,6.4699,-4.6334,4.8347,1.02474],[0.590909,6.0076,-4.4704,5.3215,1.02392],[0.598485,5.3477,-4.3158,5.4525,1.02334],[0.606061,4.52,-4.1862,5.3004,1.02304],[0.613636,3.5619,-4.0952,4.9696,1.02304],[0.621212,2.5169,-4.0525,4.4752,1.02335],[0.628788,1.4324,-4.0628,3.8397,1.02394],[0.636364,0.3573,-4.1248,3.0917,1.02476],[0.643939,-0.6595,-4.232,2.2652,1.02576],[0.651515,-1.5721,-4.373,1.3977,1.02685],[0.659091,-2.3392,-4.5329,0.5283,1.02795],[0.666667,-2.9259,-4.6945,-0.3035,1.02899],[0.674242,-3.3057,-4.8405,-1.0601,1.02986],[0.6818179999999999,-3.4615,-4.9542,-1.7071,1.0305],[0.6893940000000001,-3.427,-5.0224,-2.2191,1.03086],[0.69697,-3.2812,-5.0372,-2.5798,1.03089],[0.704545,-3.0325,-4.9977,-2.7731,1.03061],[0.7121210000000001,-2.6925,-4.9103,-2.7924,1.03004],[0.719697,-2.2769,-4.788,-2.696,1.02925],[0.727273,-1.8049,-4.648,-2.5153,1.02833],[0.7348480000000001,-1.2984,-4.5093,-2.2587,1.02738],[0.7424240000000001,-0.7807,-4.3894,-1.9381,1.0265],[0.75,-0.2758,-4.3019,-1.5684,1.02577],[0.7575759999999999,0.193,-4.2514,-1.1665,1.02522],[0.7651519999999999,0.6039,-4.2328,-0.7511,1.02485],[0.772727,0.938,-4.2356,-0.3414,1.02464],[0.780303,1.1798,-4.2459,0.0437,1.02452],[0.7878789999999999,1.3182,-4.2484,0.3863,1.02442],[0.795455,1.3485,-4.2284,0.6708,1.02427],[0.80303,1.3115,-4.1747,0.8878,1.02401],[0.8106059999999999,1.2273,-4.0802,1.029,1.02356],[0.8181820000000001,1.1023,-3.9431,1.0881,1.02291],[0.825758,0.9456,-3.7661,1.0718,1.02203],[0.833333,0.7689,-3.5555,1.0145,1.02093],[0.840909,0.5853,-3.3197,0.9235,1.01965],[0.848485,0.4083,-3.0673,0.8053,1.01822],[0.856061,0.251,-2.8057,0.6689,1.0167],[0.8636360000000001,0.1252,-2.5409,0.5242,1.01512],[0.871212,0.04,-2.2767,0.3821,1.01354],[0.878788,0.0018,-2.0155,0.2529,1.01197],[0.8863639999999999,0.0,-1.7597,0.1452,1.01044],[0.893939,0.0,-1.5115,0.0636,1.00897],[0.901515,0.0,-1.2745,0.0141,1.00756],[0.909091,0.0,-1.0521,0.0,1.00624],[0.916667,0.0,-0.8472,0.0,1.00503],[0.924242,0.0,-0.6624,0.0,1.00393],[0.9318179999999999,0.0,-0.4998,0.0,1.00297],[0.9393940000000001,0.0,-0.3607,0.0,1.00214],[0.94697,0.0,-0.246,0.0,1.00146],[0.954545,0.0,-0.1555,0.0,1.00092],[0.9621210000000001,0.0,-0.0884,0.0,1.00052],[0.969697,0.0,-0.0427,0.0,1.00025],[0.977273,0.0,-0.0157,0.0,1.00009],[0.9848480000000001,0.0,-0.0032,0.0,1.00002],[0.9924240000000001,0.0,-0.0001,0.0,1.0],[1.0,0.0,0.0,0.0,1.0]];
  const BODY_SMALL = [[0.0,0.0,0.0,0.0,1.0],[0.007576,0.0,0.0,0.0,1.0],[0.015152,0.0,-0.0031,0.0,1.00002],[0.022727,0.0,-0.0297,0.0,1.00018],[0.030303,0.0,-0.1003,0.0,1.00059],[0.037879,0.0,-0.2275,0.0,1.00135],[0.045454999999999995,0.0,-0.4172,0.0,1.00248],[0.05303,0.0,-0.6691,0.0,1.00397],[0.060606,0.0,-0.9782,0.0,1.0058],[0.068182,0.0,-1.3351,0.0,1.00792],[0.075758,0.0,-1.7276,0.0,1.01025],[0.08333299999999999,0.0,-2.1409,0.0,1.0127],[0.09090899999999999,0.0,-2.5595,0.0,1.01519],[0.09848499999999999,0.0,-2.9671,0.0,1.01761],[0.106061,0.0,-3.3483,0.0,1.01987],[0.113636,0.0,-3.6893,0.0,1.02189],[0.121212,-0.0378,-3.9789,-0.004,1.02361],[0.128788,-0.3093,-4.2118,-0.0324,1.02496],[0.136364,-0.699,-4.3844,-0.0732,1.02595],[0.143939,-0.9857,-4.4921,-0.1032,1.02664],[0.151515,-0.9976,-4.5331,-0.2045,1.02713],[0.159091,-0.627,-4.5138,-0.457,1.02755],[0.16666699999999998,0.1095,-4.4546,-0.6988,1.02803],[0.17424199999999998,1.1466,-4.3766,-0.7556,1.02858],[0.18181799999999998,2.3924,-4.2962,-0.5132,1.02909],[0.18939399999999998,3.7365,-4.2348,0.0698,1.02944],[0.19696999999999998,5.0598,-4.2131,0.9427,1.02952],[0.204545,6.2451,-4.245,2.0285,1.02925],[0.212121,7.1872,-4.3327,3.2307,1.02864],[0.219697,7.8027,-4.4656,4.4429,1.02774],[0.227273,8.0371,-4.6226,5.5576,1.02668],[0.234848,7.7039,-4.7783,6.4588,1.02559],[0.242424,6.6075,-4.9099,7.0429,1.02461],[0.25,4.8496,-5.0024,7.2587,1.02382],[0.257576,2.5953,-5.0468,7.0719,1.02328],[0.265152,0.0565,-5.0385,6.2619,1.02302],[0.272727,-2.5281,-4.9782,4.8247,1.02307],[0.280303,-4.9156,-4.8724,2.8954,1.02342],[0.287879,-6.8816,-4.7323,0.6552,1.02404],[0.295455,-8.2414,-4.5728,-1.6853,1.0249],[0.30303,-8.8671,-4.411,-3.906,1.02591],[0.310606,-8.7293,-4.2639,-5.8015,1.02701],[0.318182,-7.92,-4.1472,-7.2016,1.02811],[0.325758,-6.5082,-4.0733,-7.9743,1.02912],[0.333333,-4.6058,-4.0501,-8.0451,1.02997],[0.34090899999999996,-2.3632,-4.08,-7.4626,1.03059],[0.348485,0.0419,-4.1599,-6.3127,1.03094],[0.35606099999999996,2.4191,-4.2813,-4.6864,1.03098],[0.36363599999999996,4.5802,-4.4312,-2.7126,1.03071],[0.37121200000000004,6.354,-4.5937,-0.5475,1.03016],[0.37878799999999996,7.6002,-4.7516,1.6375,1.02937],[0.38636400000000004,8.2201,-4.8881,3.6693,1.02839],[0.39393900000000004,8.1764,-4.9886,5.3884,1.02731],[0.401515,7.5242,-5.0425,6.6641,1.0262],[0.40909100000000004,6.3214,-5.0441,7.396,1.02515],[0.416667,4.6632,-4.9931,7.5261,1.02425],[0.424242,2.6808,-4.895,7.0723,1.02356],[0.43181800000000004,0.5313,-4.7603,6.1015,1.02313],[0.439394,-1.6153,-4.6032,4.6907,1.023],[0.44697000000000003,-3.5888,-4.4405,2.9515,1.02318],[0.45454500000000003,-5.2332,-4.2894,1.0217,1.02365],[0.462121,-6.4182,-4.166,-0.946,1.02438],[0.46969700000000003,-7.0499,-4.0834,-2.7958,1.02531],[0.477273,-7.1039,-4.0504,-4.3838,1.02638],[0.484848,-6.7593,-4.0705,-5.6036,1.02749],[0.49242400000000003,-6.0734,-4.1416,-6.3618,1.02856],[0.5,-5.0868,-4.2561,-6.5968,1.02951],[0.5075759999999999,-3.8577,-4.4018,-6.3633,1.03027],[0.515152,-2.4588,-4.5633,-5.8068,1.03078],[0.522727,-0.9728,-4.7234,-4.9627,1.03099],[0.530303,0.5127,-4.865,-3.8809,1.0309],[0.537879,1.9097,-4.9732,-2.6252,1.03051],[0.545455,3.1359,-5.0364,-1.27,1.02985],[0.55303,4.1187,-5.0478,0.1049,1.02897],[0.560606,4.8,-5.0064,1.4181,1.02794],[0.568182,5.1397,-4.9164,2.592,1.02683],[0.575758,5.1471,-4.7875,3.5605,1.02574],[0.583333,4.9603,-4.6334,4.2807,1.02474],[0.590909,4.6059,-4.4704,4.7118,1.02392],[0.598485,4.0999,-4.3158,4.8277,1.02334],[0.606061,3.4653,-4.1862,4.6931,1.02304],[0.613636,2.7308,-4.0952,4.4002,1.02304],[0.621212,1.9297,-4.0525,3.9624,1.02335],[0.628788,1.0981,-4.0628,3.3997,1.02394],[0.636364,0.2739,-4.1248,2.7374,1.02476],[0.643939,-0.5056,-4.232,2.0057,1.02576],[0.651515,-1.2053,-4.373,1.2375,1.02685],[0.659091,-1.7934,-4.5329,0.4678,1.02795],[0.666667,-2.2432,-4.6945,-0.2687,1.02899],[0.674242,-2.5344,-4.8405,-0.9386,1.02986],[0.6818179999999999,-2.6538,-4.9542,-1.5115,1.0305],[0.6893940000000001,-2.6274,-5.0224,-1.9648,1.03086],[0.69697,-2.5156,-5.0372,-2.2842,1.03089],[0.704545,-2.3249,-4.9977,-2.4554,1.03061],[0.7121210000000001,-2.0642,-4.9103,-2.4724,1.03004],[0.719697,-1.7456,-4.788,-2.387,1.02925],[0.727273,-1.3838,-4.648,-2.2271,1.02833],[0.7348480000000001,-0.9954,-4.5093,-1.9999,1.02738],[0.7424240000000001,-0.5985,-4.3894,-1.7161,1.0265],[0.75,-0.2114,-4.3019,-1.3887,1.02577],[0.7575759999999999,0.1479,-4.2514,-1.0328,1.02522],[0.7651519999999999,0.463,-4.2328,-0.665,1.02485],[0.772727,0.7191,-4.2356,-0.3023,1.02464],[0.780303,0.9045,-4.2459,0.0387,1.02452],[0.7878789999999999,1.0106,-4.2484,0.342,1.02442],[0.795455,1.0339,-4.2284,0.5939,1.02427],[0.80303,1.0055,-4.1747,0.7861,1.02401],[0.8106059999999999,0.9409,-4.0802,0.9111,1.02356],[0.8181820000000001,0.8451,-3.9431,0.9634,1.02291],[0.825758,0.725,-3.7661,0.949,1.02203],[0.833333,0.5895,-3.5555,0.8983,1.02093],[0.840909,0.4487,-3.3197,0.8176,1.01965],[0.848485,0.313,-3.0673,0.713,1.01822],[0.856061,0.1925,-2.8057,0.5922,1.0167],[0.8636360000000001,0.096,-2.5409,0.4642,1.01512],[0.871212,0.0306,-2.2767,0.3383,1.01354],[0.878788,0.0014,-2.0155,0.224,1.01197],[0.8863639999999999,0.0,-1.7597,0.1285,1.01044],[0.893939,0.0,-1.5115,0.0563,1.00897],[0.901515,0.0,-1.2745,0.0125,1.00756],[0.909091,0.0,-1.0521,0.0,1.00624],[0.916667,0.0,-0.8472,0.0,1.00503],[0.924242,0.0,-0.6624,0.0,1.00393],[0.9318179999999999,0.0,-0.4998,0.0,1.00297],[0.9393940000000001,0.0,-0.3607,0.0,1.00214],[0.94697,0.0,-0.246,0.0,1.00146],[0.954545,0.0,-0.1555,0.0,1.00092],[0.9621210000000001,0.0,-0.0884,0.0,1.00052],[0.969697,0.0,-0.0427,0.0,1.00025],[0.977273,0.0,-0.0157,0.0,1.00009],[0.9848480000000001,0.0,-0.0032,0.0,1.00002],[0.9924240000000001,0.0,-0.0001,0.0,1.0],[1.0,0.0,0.0,0.0,1.0]];

  function loadImage(name) {
    return new Promise((resolve,reject) => {
      const image = new Image();
      image.decoding = 'async';
      let done = false;
      const timer = setTimeout(() => finish(new Error('Globe texture timeout: '+name)), 8000);
      function finish(error) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        image.onload = image.onerror = null;
        if (error) reject(error); else resolve(image);
      }
      image.onload = () => {
        const decoded = image.decode ? image.decode() : Promise.resolve();
        decoded.catch(() => {}).then(() => finish());
      };
      image.onerror = () => finish(new Error('Globe texture unavailable: '+name));
      image.src = window.BALL_GPU_ASSETS?.[name] || new URL(name,ROOT).href;
    });
  }
  function prime() {
    if (!imagesPromise) {
      imagesPromise = Promise.all(FILES.map(loadImage)).catch(error => {
        imagesPromise = null;
        throw error;
      });
    }
    return imagesPromise;
  }

  // CSS cubic-bezier timing, evaluated per keyframe interval (as on desktop).
  function bezier(x1,y1,x2,y2) {
    const f = (t,a,b) => 3*(1-t)*(1-t)*t*a+3*(1-t)*t*t*b+t*t*t;
    return x => {
      if (x<=0 || x>=1) return clamp(x);
      let lo=0,hi=1,t=x;
      for (let i=0;i<12;i++) {
        const at=f(t,x1,x2);
        if (at<x) lo=t; else hi=t;
        t=(lo+hi)*.5;
      }
      return f(t,y1,y2);
    };
  }
  const linear=x=>x;
  const easeInOut=bezier(.42,0,.58,1);
  const easeOut=bezier(0,0,.58,1);
  const tumbleEase=bezier(.22,.07,.44,.96);
  const riseEase=bezier(.18,.65,.24,1);
  const faceEase=bezier(.18,.67,.20,1);
  function sample(keys,t,ease=linear) {
    t=clamp(t);
    let i=1;
    while (i<keys.length-1 && t>keys[i][0]) i++;
    const a=keys[i-1],b=keys[i],u=ease(clamp((t-a[0])/(b[0]-a[0] || 1)));
    return a.slice(1).map((v,j)=>lerp(v,b[j+1],u));
  }
  const DIVE = [[0,0,0,1,1,1],[.10,-5,5,1,.985,.97],[.20,9,-6,.995,.84,.84],[.29,-7,7,.987,.55,.67],[.38,4,5,.974,.20,.43],[.47,0,7,.965,.012,.31],[.54,0,7,.965,0,.29],[1,0,7,.965,0,.29]];
  const SURFACE = [[0,0,7,.965,0,.31],[.16,2,6,.970,.22,.47],[.34,-2,3,.985,.70,.69],[.54,0,1,.995,.95,.90],[.72,0,-1,1.004,1,1],[.87,0,.4,.999,1,1],[1,0,0,1,1,1]];
  const INK_OUT = [[0,1],[.29,1],[.38,.65],[.48,.08],[.60,0],[1,0]];
  const INK_IN = [[0,0],[.22,0],[.57,.72],[.82,1],[1,1]];

  // Column-major CSS-compatible Rx * Ry * Rz. The projection flips screen Y.
  function rotation(x,y,z,out) {
    const a=x*radians,b=y*radians,c=z*radians;
    const cx=Math.cos(a),sx=Math.sin(a),cy=Math.cos(b),sy=Math.sin(b),cz=Math.cos(c),sz=Math.sin(c);
    out[0]=cy*cz; out[1]=cx*sz+sx*sy*cz; out[2]=sx*sz-cx*sy*cz;
    out[3]=-cy*sz;out[4]=cx*cz-sx*sy*sz;out[5]=sx*cz+cx*sy*sz;
    out[6]=sy;out[7]=-sx*cy;out[8]=cx*cy;
    return out;
  }
  function vertices() {
    const data=[],m=new Float32Array(9);
    const corners=[[-.5,-.5,0,0],[-.5,.5,0,1],[.5,.5,1,1],[-.5,-.5,0,0],[.5,.5,1,1],[.5,-.5,1,0]];
    const orient=[[0,0],[0,90],[90,0],[0,-90],[-90,0],[0,180]];
    orient.forEach(([x,y],face)=>{
      rotation(x,y,0,m);
      for (const [a,b,u,v] of corners) {
        data.push(m[0]*a+m[3]*b+m[6]*.5,m[1]*a+m[4]*b+m[7]*.5,m[2]*a+m[5]*b+m[8]*.5,u,v,m[6],m[7],m[8],face);
      }
    });
    return new Float32Array(data);
  }
  function program(gl,vs,fs,attributes) {
    const compile=(type,source)=>{
      const shader=gl.createShader(type);
      if (!shader) throw new Error('Cannot allocate globe shader');
      gl.shaderSource(shader,source);gl.compileShader(shader);
      if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) {
        const error=gl.getShaderInfoLog(shader);gl.deleteShader(shader);
        throw new Error('Globe shader: '+error);
      }
      return shader;
    };
    const vertex=compile(gl.VERTEX_SHADER,vs),fragment=compile(gl.FRAGMENT_SHADER,fs);
    const p=gl.createProgram();
    gl.attachShader(p,vertex);gl.attachShader(p,fragment);
    attributes.forEach((name,i)=>gl.bindAttribLocation(p,i,name));
    gl.linkProgram(p);gl.deleteShader(vertex);gl.deleteShader(fragment);
    if (!gl.getProgramParameter(p,gl.LINK_STATUS)) {
      const error=gl.getProgramInfoLog(p);gl.deleteProgram(p);
      throw new Error('Globe shader link: '+error);
    }
    return p;
  }
  const SPRITE_VS=`attribute vec2 a_position;varying mediump vec2 v_uv;
    void main(){v_uv=a_position;gl_Position=vec4(a_position*vec2(2.0,-2.0)+vec2(-1.0,1.0),0.99,1.0);}`;
  const SPRITE_FS=`precision mediump float;varying mediump vec2 v_uv;uniform sampler2D u_image;
    void main(){gl_FragColor=texture2D(u_image,v_uv);}`;
  const CUBE_VS=`attribute vec3 a_position;attribute vec2 a_uv;attribute vec3 a_normal;attribute float a_face;
    uniform mat3 u_rotation;uniform float u_edge;uniform vec2 u_center;uniform float u_perspective;
    varying mediump vec2 v_uv;varying mediump vec3 v_normal;varying mediump float v_face;
    void main(){
      vec3 p=u_rotation*a_position*u_edge;
      float w=1.0-p.z/u_perspective;
      vec2 windowCenter=vec2(0.5,0.51497);
      vec2 q=(windowCenter*2.0-1.0)*w+2.0*(u_center-windowCenter+p.xy);
      gl_Position=vec4(q.x,-q.y,-p.z,w);
      v_uv=a_uv;v_normal=u_rotation*a_normal;v_face=a_face;
    }`;
  const CUBE_FS=`precision mediump float;
    uniform sampler2D u_faces;uniform sampler2D u_resin;
    uniform float u_opacity;uniform float u_brightness;uniform float u_ink;uniform float u_size;
    varying mediump vec2 v_uv;varying mediump vec3 v_normal;varying mediump float v_face;
    void main(){
      vec2 screen=vec2(gl_FragCoord.x/u_size,1.0-gl_FragCoord.y/u_size);
      float radius=length(screen-vec2(0.5,0.51497))/0.24292;
      if(radius>=1.0)discard;
      vec2 tile=vec2(mod(floor(v_face+0.5),3.0),floor((v_face+0.5)/3.0));
      vec2 atlas=(tile*256.0+0.5+v_uv*255.0)/vec2(768.0,512.0);
      vec4 plain=texture2D(u_resin,(0.5+v_uv*255.0)/256.0);
      vec4 numbered=texture2D(u_faces,atlas);
      float facing=max(normalize(v_normal).z,0.0);
      float ink=u_ink*smoothstep(0.12,0.52,facing);
      vec4 color=mix(plain,numbered,ink);
      float light=0.34+0.66*pow(facing,0.45);
      color.rgb*=u_brightness*light;
      color.a*=u_opacity*(1.0-smoothstep(0.975,1.0,radius));
      if(color.a<0.003)discard;
      gl_FragColor=color;
    }`;

  class Globe {
    constructor(ball,images,face) {
      this.ball=ball;this.images=images;this.face=face;this.ready=false;this.lost=false;
      this.raf=0;this.resizeRAF=0;this.job=null;this.elapsed=0;this.previous=null;
      this.matrix=new Float32Array(9);this.lastStats=null;
      this.canvas=document.createElement('canvas');
      this.canvas.className='magic-ball-gpu';
      this.canvas.setAttribute('aria-hidden','true');
      this.canvas.style.opacity='0';
      this.gl=this.canvas.getContext('webgl',{alpha:true,antialias:true,depth:true,stencil:false,premultipliedAlpha:true,preserveDrawingBuffer:false,powerPreference:'default'});
      if (!this.gl) throw new Error('WebGL unavailable');
      this.ball.append(this.canvas);
      this.onLost=event=>{
        event.preventDefault();this.lost=true;
        this.cancel(this.face);this.ball.classList.remove('ball-gpu-active');
        this.canvas.style.opacity='0';
      };
      this.onRestored=()=>{
        try {
          this.initResources();this.lost=false;this.resize();
          if(this.isVisible()){this.renderAt(TOTAL,this.face,this.face);this.gl.flush();}
          this.canvas.style.opacity='1';this.ball.classList.add('ball-gpu-active');
        } catch (_) { this.lost=true;this.ball.classList.remove('ball-gpu-active'); }
      };
      this.onVisibility=()=>{
        if(!this.isVisible()){cancelAnimationFrame(this.raf);this.raf=0;this.previous=null;}
        else if(this.job){this.previous=null;this.raf=requestAnimationFrame(t=>this.tick(t));}
        else if(this.ready && !this.lost){this.renderAt(TOTAL,this.face,this.face);}
      };
      this.onResize=()=>{
        if(!this.ready || !this.isVisible() || this.resizeRAF)return;
        this.resizeRAF=requestAnimationFrame(()=>{
          this.resizeRAF=0;
          if(!this.ready || !this.isVisible())return;
          this.resize();
          if(!this.lost)this.renderAt(this.job?this.elapsed:TOTAL,this.job?.from||this.face,this.job?.to||this.face);
        });
      };
      this.canvas.addEventListener('webglcontextlost',this.onLost,false);
      this.canvas.addEventListener('webglcontextrestored',this.onRestored,false);
      document.addEventListener('visibilitychange',this.onVisibility);
      window.addEventListener('resize',this.onResize,{passive:true});
      this.observer=typeof ResizeObserver==='function'?new ResizeObserver(this.onResize):null;
      this.observer?.observe(ball);
    }
    isVisible() {
      return !document.hidden && !!this.ball.closest('dialog')?.open;
    }
    resume() {
      if(!this.isVisible() || !this.ready || this.lost || this.job)return;
      this.resize();this.renderAt(TOTAL,this.face,this.face);this.gl.flush();
    }
    initResources() {
      const gl=this.gl;
      this.spriteProgram=program(gl,SPRITE_VS,SPRITE_FS,['a_position']);
      this.cubeProgram=program(gl,CUBE_VS,CUBE_FS,['a_position','a_uv','a_normal','a_face']);
      this.spriteImage=gl.getUniformLocation(this.spriteProgram,'u_image');
      this.uniforms=Object.fromEntries(['rotation','edge','center','perspective','faces','resin','opacity','brightness','ink','size'].map(name=>[name,gl.getUniformLocation(this.cubeProgram,'u_'+name)]));
      this.quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,0,1,1,1,0,0,1,1,1,0]),gl.STATIC_DRAW);
      this.cube=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.cube);gl.bufferData(gl.ARRAY_BUFFER,vertices(),gl.STATIC_DRAW);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
      this.textures=this.images.map(image=>{
        const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);return texture;
      });
      gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0,0,0,0);gl.clearDepth(1);gl.depthFunc(gl.LESS);gl.frontFace(gl.CCW);gl.cullFace(gl.BACK);
    }
    resize() {
      // Never resize the backing buffer in the animation loop: doing so clears it.
      const cssSize=this.ball.clientWidth || this.cssSize || 306;
      this.cssSize=cssSize;
      const size=Math.max(256,Math.min(768,Math.round(cssSize*Math.min(window.devicePixelRatio||1,2.5))));
      if(this.canvas.width!==size || this.canvas.height!==size){this.canvas.width=size;this.canvas.height=size;}
      this.gl.viewport(0,0,size,size);
      const width=window.innerWidth;
      this.track=width<=360?BODY_SMALL:width<=420?BODY_PHONE:BODY_DESKTOP;
    }
    drawSprite(index) {
      const gl=this.gl;
      gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.useProgram(this.spriteProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
      gl.disableVertexAttribArray(1);gl.disableVertexAttribArray(2);gl.disableVertexAttribArray(3);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.textures[index]);gl.uniform1i(this.spriteImage,0);
      gl.drawArrays(gl.TRIANGLES,0,6);
    }
    drawCube(angles,fluid,ink) {
      if(fluid[3]<=.002)return;
      const gl=this.gl,u=this.uniforms;
      gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.useProgram(this.cubeProgram);gl.bindBuffer(gl.ARRAY_BUFFER,this.cube);
      const fields=[[3,0],[2,12],[3,20],[1,32]];
      fields.forEach(([size,offset],i)=>{gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,size,gl.FLOAT,false,36,offset);});
      gl.uniformMatrix3fv(u.rotation,false,rotation(...angles,this.matrix));
      gl.uniform1f(u.edge,(92/332)*fluid[2]);
      gl.uniform2f(u.center,.5+fluid[0]/332,.51979+fluid[1]/332);
      gl.uniform1f(u.perspective,420/332);
      gl.uniform1f(u.opacity,fluid[3]);gl.uniform1f(u.brightness,fluid[4]);gl.uniform1f(u.ink,ink);gl.uniform1f(u.size,this.canvas.width);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.textures[2]);gl.uniform1i(u.faces,0);
      gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.textures[3]);gl.uniform1i(u.resin,1);
      gl.drawArrays(gl.TRIANGLES,0,36);
    }
    renderAt(ms,from,to) {
      if(this.lost)return;
      const a=FACES[from-1]||FACES[0],b=FACES[to-1]||FACES[0];
      let body=[0,0,0,1],angles=[...b,0],fluid=[0,0,1,1,1],ink=1;
      if(ms<MIX) {
        const t=clamp((ms-480)/1110);
        body=sample(this.track,ms/MIX);
        angles=sample([[0,a[0],a[1],0],[.13,a[0]+71,a[1]-52,19],[.29,a[0]+174,a[1]-119,-15],[.47,a[0]+257,a[1]-217,18],[.70,b[0]+341,b[1]-387,7],[1,b[0]+360,b[1]-360,0]],t,tumbleEase);
        fluid=sample(DIVE,t,easeInOut);ink=sample(INK_OUT,ms/MIX)[0];
      } else if(ms<MIX+DARK) {
        fluid=[0,7,.965,0,.31];ink=0;
      } else if(ms<TOTAL) {
        const t=(ms-MIX-DARK)/RISE;
        fluid=sample(SURFACE,t,riseEase);ink=sample(INK_IN,t,easeOut)[0];
        angles=sample([[0,b[0]+14,b[1]-13,3.5],[.35,b[0]+5,b[1]-5,1.3],[.67,b[0]-1.6,b[1]+1,-.4],[.85,b[0]+.5,b[1],.1],[1,b[0],b[1],0]],t,faceEase);
      }
      const transform=`translate3d(${body[0].toFixed(4)}%,${body[1].toFixed(4)}%,0) rotate(${body[2].toFixed(4)}deg) scale(${body[3].toFixed(6)})`;
      this.ball.style.setProperty('transform',transform,'important');
      const gl=this.gl;
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      this.drawSprite(0);this.drawCube(angles,fluid,ink);this.drawSprite(1);
    }
    async show() {
      this.initResources();this.resize();
      await new Promise(resolve=>requestAnimationFrame(resolve));
      if(this.lost)throw new Error('Globe context lost during initialization');
      if(this.isVisible()){this.renderAt(TOTAL,this.face,this.face);this.gl.flush();}
      this.ready=true;
      this.canvas.style.opacity='1';
      this.ball.classList.add('ball-gpu-active');
      return this;
    }
    play(from,to,onImpact) {
      if(!this.ready||this.lost)return Promise.resolve(false);
      this.cancel(from);this.resize();
      return new Promise(resolve=>{
        this.job={from,to,onImpact,resolve,impact:false};this.elapsed=0;this.previous=null;
        this.lastStats={frames:0,maxFrameGap:0,elapsed:0,completed:false};
        this.ball.classList.add('ball-gpu-moving');
        this.raf=requestAnimationFrame(t=>this.tick(t));
      });
    }
    tick(now) {
      this.raf=0;
      const job=this.job;
      if(!job||this.lost)return;
      if(!this.isVisible()){this.previous=null;return;}
      const dt=this.previous===null?0:Math.max(0,now-this.previous);
      this.previous=now;
      // A suspended tab or long unrelated task must not teleport the die.
      this.elapsed=Math.min(TOTAL,this.elapsed+Math.min(dt,50));
      this.lastStats.frames++;this.lastStats.maxFrameGap=Math.max(this.lastStats.maxFrameGap,dt);this.lastStats.elapsed=this.elapsed;
      this.renderAt(this.elapsed,job.from,job.to);
      if(!job.impact && this.elapsed>=480){job.impact=true;try{job.onImpact?.();}catch(_){}}
      if(this.elapsed>=TOTAL){
        this.face=job.to;this.job=null;this.previous=null;
        this.lastStats.completed=true;this.ball.classList.remove('ball-gpu-moving');
        this.ball.style.removeProperty('transform');job.resolve(true);
      } else this.raf=requestAnimationFrame(t=>this.tick(t));
    }
    cancel(face=this.face) {
      cancelAnimationFrame(this.raf);this.raf=0;this.previous=null;
      const job=this.job;this.job=null;this.face=face;
      this.ball.classList.remove('ball-gpu-moving');this.ball.style.removeProperty('transform');
      if(this.isVisible()&&this.ready&&!this.lost){this.renderAt(TOTAL,face,face);this.ball.style.removeProperty('transform');}
      if(job)job.resolve(false);
    }
    setFace(face) {this.cancel(face);}
    destroy() {
      this.cancel();cancelAnimationFrame(this.resizeRAF);this.observer?.disconnect();
      document.removeEventListener('visibilitychange',this.onVisibility);window.removeEventListener('resize',this.onResize);
      this.canvas.removeEventListener('webglcontextlost',this.onLost);this.canvas.removeEventListener('webglcontextrestored',this.onRestored);
      this.ball.classList.remove('ball-gpu-active','ball-gpu-moving');this.canvas.remove();
      const gl=this.gl;
      if(!this.lost){for(const t of this.textures||[])gl.deleteTexture(t);gl.deleteBuffer(this.quad);gl.deleteBuffer(this.cube);gl.deleteProgram(this.spriteProgram);gl.deleteProgram(this.cubeProgram);}
      this.ready=false;
    }
  }
  window.MobileMagicBall=Object.freeze({prime,async create(ball,face=1){
    const images=await prime();let globe;
    try{globe=new Globe(ball,images,face);return await globe.show();}
    catch(error){globe?.destroy();throw error;}
  }});
})();
