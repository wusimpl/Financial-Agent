from __future__ import annotations

import html
import re
from typing import Any

from app.schemas import FilingMetadata, FilingSection


class SecDocumentParser:
    tag_pattern = re.compile(r"<[^>]+>")
    script_pattern = re.compile(r"<(script|style).*?</\1>", re.IGNORECASE | re.DOTALL)
    whitespace_pattern = re.compile(r"[ \t\r\f\v]+")
    line_pattern = re.compile(r"\n{3,}")

    def parse(self, document: str) -> str:
        without_scripts = self.script_pattern.sub(" ", document)
        with_breaks = re.sub(r"</(p|div|tr|li|h[1-6])>", "\n", without_scripts, flags=re.IGNORECASE)
        without_tags = self.tag_pattern.sub(" ", with_breaks)
        decoded = html.unescape(without_tags)
        normalized = self.whitespace_pattern.sub(" ", decoded)
        normalized = re.sub(r" *\n *", "\n", normalized)
        return self.line_pattern.sub("\n\n", normalized).strip()


class SecSectionExtractor:
    section_specs = [
        ("business", "Business", re.compile(r"\bitem\s+1\.?\s+business\b", re.IGNORECASE)),
        ("risk_factors", "Risk Factors", re.compile(r"\bitem\s+1a\.?\s+risk\s+factors\b", re.IGNORECASE)),
        (
            "management_discussion",
            "Management Discussion and Analysis",
            re.compile(r"\bitem\s+7\.?\s+management['’]?s?\s+discussion\s+and\s+analysis\b", re.IGNORECASE),
        ),
    ]
    next_item_pattern = re.compile(r"\bitem\s+\d+[a-z]?\.?\s+", re.IGNORECASE)

    def extract(self, text: str) -> list[FilingSection]:
        matches: list[tuple[str, str, int, int]] = []
        for name, title, pattern in self.section_specs:
            found = pattern.search(text)
            if found:
                matches.append((name, title, found.start(), found.end()))

        matches.sort(key=lambda item: item[2])
        sections: list[FilingSection] = []
        for index, (name, title, start, content_start) in enumerate(matches):
            default_end = matches[index + 1][2] if index + 1 < len(matches) else len(text)
            next_item = self.next_item_pattern.search(text, content_start)
            end = min(default_end, next_item.start()) if next_item else default_end
            content = text[content_start:end].strip()
            if content:
                sections.append(FilingSection(name=name, title=title, content=content))
        return sections


class SecMetadataMapper:
    def map(self, company: dict[str, Any], filing: dict[str, Any], submissions: dict[str, Any] | None = None) -> FilingMetadata:
        submissions = submissions or {}
        return FilingMetadata(
            form_type=str(filing.get("form") or filing.get("form_type") or ""),
            report_period=filing.get("reportDate") or filing.get("report_date"),
            company_name=str(company.get("title") or company.get("company_name") or company.get("name") or ""),
            accession_number=str(filing.get("accessionNumber") or filing.get("accession_number") or ""),
            state_of_incorporation=submissions.get("stateOfIncorporation") or submissions.get("state_of_incorporation"),
            employer_identification_number=submissions.get("ein") or submissions.get("employer_identification_number"),
            cik=str(company.get("cik") or "") or None,
        )
