# Financial Agent

当前阶段先建设后端数据源能力，并已合入一版前端外观布局稿。

## 目录

```text
backend/
  app/
    core/       # 配置和缓存
    sources/    # 数据源接口
  data/cache/   # 本地缓存，不提交
  tests/

frontend/       # 前端界面，当前使用本地示例数据
```

## 后端数据源

- SEC 财报：获取公司信息、10-K/10-Q 列表、报告正文、结构化财务数据
- Twitter/X：通过本机 `twitter` 命令获取搜索结果和用户推文
- 美股 K 线：通过本机 `easy-tdx` 获取 `US_STOCK` 日线等行情数据

## SEC 财报接口

```text
GET /sources/sec/{ticker}/company
GET /sources/sec/{ticker}/filings?forms=10-K,10-Q&limit=10
GET /sources/sec/{ticker}/filings?forms=10-K&year=2024
GET /sources/sec/{ticker}/filing-by-year?form=10-K&year=2024
GET /sources/sec/{ticker}/filing-document-by-year?form=10-K&year=2024
GET /sources/sec/{ticker}/facts
```

年份默认按报告期匹配。需要按提交年份匹配时，加：

```text
year_basis=filing
```

## 运行

后端：

```bash
cd backend
python3 -m pip install -e .
uvicorn app.main:app --reload
```

SEC 请求建议设置身份标识：

```bash
export FINANCIAL_AGENT_SEC_USER_AGENT="financial-agent your-email@example.com"
```

前端：

```bash
cd frontend
npm install
npm run dev
```

前端当前只体现外观和布局，还没有接入后端接口。
