// Auto-generated from concept_map.py — DO NOT EDIT BY HAND
// Run: python sync_concept_map.py

const MAIN_CONCEPTS ={
  46: {
    concept: "随机变量 · 期望值 · 方差",
    one_liner: "输入股票收益率列表 → 输出均值(长期平均)和标准差(波动幅度) → 衡量策略稳定性",
    contrast_with: null
  },
  47: {
    concept: "相关性 · 协方差矩阵",
    one_liner: "输入10只股票收益率 → 输出协方差矩阵+热力图 → 看哪些股票同涨同跌",
    contrast_with: 46
  },
  48: {
    concept: "假设检验 · Bootstrap",
    one_liner: "输入策略收益率列表 → Bootstrap 1000次 → 输出p值和偏离距离 → 判断策略是实力还是运气",
    contrast_with: 47
  },
  49: {
    concept: "股票 · 交易所机制 · A股规则",
    one_liner: "了解T+1交割、涨跌停±10%、印花税——这些规则直接影响你的策略能不能执行",
    contrast_with: 48
  },
  50: {
    concept: "K线图 · 成交量 · 换手率",
    one_liner: "输入日线数据 → mplfinance画K线 → 读图判断趋势和成交量配合",
    contrast_with: null
  },
  67: {
    concept: "Embedding · 语义向量",
    one_liner: "输入文本 → 输出768维向量 → 语义相近的文本向量距离近",
    contrast_with: null
  },
  69: {
    concept: "ChromaDB · 向量数据库",
    one_liner: "输入查询文本 → 向量相似度搜索 → 输出最相关的文档片段",
    contrast_with: 67
  },
  71: {
    concept: "Temperature · Top-P · LLM参数",
    one_liner: "调整temperature=0(确定)~1(随机) → 控制LLM输出的创造性",
    contrast_with: null
  },
  79: {
    concept: "Attention · Q×Kᵀ×V",
    one_liner: "查询(Q)×键(K)的转置→相似度矩阵×值(V)→加权输出——LLM理解上下文的数学引擎",
    contrast_with: 67
  },
  84: {
    concept: "回测三大死穴 · 过拟合",
    one_liner: "前视偏差(用了未来数据)、幸存者偏差(只测活着的股票)、过拟合(记住了噪音)——回测漂亮≠实盘赚钱",
    contrast_with: null
  },
  86: {
    concept: "向量化回测 · SMA金叉死叉",
    one_liner: "输入行情DataFrame → pandas向量化计算买卖信号 → 输出资金曲线",
    contrast_with: 84
  },
  91: {
    concept: "Alpha因子 · 因子分类",
    one_liner: "动量(涨的继续涨)、价值(便宜的会涨)、质量(好公司)、波动率(低波动高收益)——每种因子从不同角度给股票打分",
    contrast_with: null
  },
  93: {
    concept: "因子IC分析",
    one_liner: "输入因子值+未来收益 → 输出IC(相关系数) → |IC|>0.03可用, <0.01没用",
    contrast_with: 91
  },
  95: {
    concept: "Sharpe · MaxDD · Calmar",
    one_liner: "输入策略收益率 → 输出Sharpe(性价比)、MaxDD(最惨跌幅)、Calmar(睡得着指数)",
    contrast_with: 48
  },
  96: {
    concept: "Walk-Forward 滚动验证",
    one_liner: "前N天训练→后M天测试→滚动→多窗口都有效才是真有效",
    contrast_with: 95
  },
  97: {
    concept: "蒙特卡洛模拟检验",
    one_liner: "随机打乱交易顺序1000次→如果真实收益在随机分布前5%→策略显著",
    contrast_with: 48
  }
};

const MATH_RECALL ={
  8: {
    main_day_used: 46,
    recall_question: "你在 Main Day 46 用正态分布画收益率直方图时，看到「钟形曲线」了吗？今天学它的数学含义——μ和σ分别控制什么。"
  },
  9: {
    main_day_used: 46,
    recall_question: "Main Day 46 你用 numpy 算过期望值（长期平均值）。今天的数学告诉你 E[X]=Σ(x·P(x))——每个可能值乘以它的概率。"
  },
  10: {
    main_day_used: 46,
    recall_question: "Main Day 46 你算过标准差来衡量波动。今天学方差 Var=E[(X-μ)²]——为什么需要平方再开方？"
  },
  11: {
    main_day_used: 47,
    recall_question: "Main Day 47 你画过热力图看股票相关性。今天学 r ∈ [-1,+1]——正=同涨跌，负=反向，0=无关。"
  },
  19: {
    main_day_used: 47,
    recall_question: "Main Day 47 你算过协方差矩阵。今天学 Cov(X,Y)=E[(X-μx)(Y-μy)]——它和相关性的关系是什么？"
  },
  15: {
    main_day_used: 48,
    recall_question: "Main Day 48 你用 Bootstrap 做了假设检验。今天学假设检验的数学框架——H₀、p值、拒绝域。"
  },
  16: {
    main_day_used: 48,
    recall_question: "Main Day 48 你用过 p 值来判断策略是否显著。今天深入理解：p 值到底是什么、不是什么。"
  },
  49: {
    main_day_used: 48,
    recall_question: "Main Day 48 你把收益率列表扔进 Bootstrap，拿到了 p 值。今天拆开黑盒——归零→重抽样→算分布→数极端比例。"
  },
  23: {
    main_day_used: 84,
    recall_question: "Main Day 84 学过拟合是回测的一大死穴。今天从数学角度理解——R²=1.0 不是好事，参数越多越危险。"
  },
  40: {
    main_day_used: 86,
    recall_question: "Main Day 86 你用 pct_change() 算收益率做回测。今天学两种收益率——简单的和对数的——什么时候用哪个。"
  },
  45: {
    main_day_used: 95,
    recall_question: "Main Day 95 你用 Sharpe 评估策略。今天学它的公式——(收益-无风险)/波动——为什么要除以波动？"
  },
  48: {
    main_day_used: 93,
    recall_question: "Main Day 93 你算过因子 IC。今天深入学 IC 的数学——Pearson IC vs Rank IC，哪个更稳健？"
  },
  50: {
    main_day_used: 97,
    recall_question: "Main Day 97 你跑过蒙特卡洛模拟。今天学它的三步框架——定义分布→模拟路径→统计结果。"
  }
};
