from __future__ import annotations

from app.logic.tickers import TickerNormalizer
from app.schemas import SocialLanguage, SocialMinFaves


CHINESE_SOCIAL_ALIASES = {
    "AAPL": "苹果",
    "ABBV": "艾伯维",
    "ABT": "雅培",
    "ADBE": "Adobe",
    "ADI": "亚德诺",
    "AMAT": "应用材料",
    "AMD": "超威半导体",
    "AMGN": "安进",
    "AMZN": "亚马逊",
    "AXP": "美国运通",
    "BA": "波音",
    "BAC": "美国银行",
    "BKNG": "Booking",
    "BLK": "贝莱德",
    "BMY": "百时美施贵宝",
    "BRK.B": "伯克希尔",
    "C": "花旗",
    "CAT": "卡特彼勒",
    "CME": "芝商所",
    "CMCSA": "康卡斯特",
    "COP": "康菲石油",
    "COST": "好市多",
    "CRM": "赛富时",
    "CSCO": "思科",
    "CVX": "雪佛龙",
    "DE": "迪尔",
    "DHR": "丹纳赫",
    "DIS": "迪士尼",
    "ELV": "Elevance",
    "GE": "通用电气",
    "GILD": "吉利德",
    "GOOG": "谷歌",
    "GOOGL": "谷歌",
    "GS": "高盛",
    "HD": "家得宝",
    "HON": "霍尼韦尔",
    "IBM": "IBM",
    "INTC": "英特尔",
    "ISRG": "直觉外科",
    "JNJ": "强生",
    "JPM": "摩根大通",
    "KO": "可口可乐",
    "LIN": "林德",
    "LLY": "礼来",
    "LOW": "劳氏",
    "LRCX": "泛林",
    "MA": "万事达",
    "MCD": "麦当劳",
    "MCO": "穆迪",
    "MDT": "美敦力",
    "META": "Meta",
    "MMM": "3M",
    "MO": "奥驰亚",
    "MRK": "默沙东",
    "MS": "摩根士丹利",
    "MSFT": "微软",
    "MU": "美光",
    "NFLX": "奈飞",
    "NKE": "耐克",
    "NVDA": "英伟达",
    "ORCL": "甲骨文",
    "PANW": "帕洛阿尔托网络",
    "PEP": "百事",
    "PFE": "辉瑞",
    "PG": "宝洁",
    "PLTR": "Palantir",
    "PM": "菲利普莫里斯",
    "PYPL": "贝宝",
    "QCOM": "高通",
    "RTX": "雷神",
    "SBUX": "星巴克",
    "SCHW": "嘉信理财",
    "SHOP": "Shopify",
    "SPGI": "标普全球",
    "T": "AT&T",
    "TMO": "赛默飞",
    "TSLA": "特斯拉",
    "TXN": "德州仪器",
    "UBER": "优步",
    "UNH": "联合健康",
    "UNP": "联合太平洋",
    "UPS": "UPS",
    "V": "Visa",
    "VRTX": "福泰制药",
    "WFC": "富国银行",
    "WMT": "沃尔玛",
    "XOM": "埃克森美孚",
}


def normalize_social_min_faves(min_faves: SocialMinFaves | int) -> int:
    return int(SocialMinFaves(min_faves))


def build_social_search_query(
    ticker: str,
    language: SocialLanguage | str = SocialLanguage.zh,
    min_faves: SocialMinFaves | int = SocialMinFaves.thirty,
) -> str:
    normalized = TickerNormalizer.normalize(ticker)
    normalized_language = SocialLanguage(language)
    normalized_min_faves = normalize_social_min_faves(min_faves)
    terms = [f"${normalized}"]

    if normalized_language == SocialLanguage.zh:
        alias = CHINESE_SOCIAL_ALIASES.get(normalized)
        if alias:
            terms.append(_quote_if_needed(alias))

    subject = terms[0] if len(terms) == 1 else f"({' OR '.join(terms)})"
    return f"{subject} lang:{normalized_language.value} min_faves:{normalized_min_faves}"


def _quote_if_needed(term: str) -> str:
    return f'"{term}"' if any(char.isspace() for char in term) else term
