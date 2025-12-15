#!/usr/bin/env python3
"""
PDF Generator CLI

Command-line interface for generating PDF documents.

Usage:
    python -m pdf_generator.cli cuas-auxiliary -o output.pdf
    python -m pdf_generator.cli list
"""

import argparse
import sys
from pathlib import Path


def cmd_cuas_auxiliary(args):
    """Generate CUAS Sandbox 2026 auxiliary document."""
    from .documents.cuas_auxiliary import generate_cuas_auxiliary

    output = args.output or "CUAS_Sandbox_2026_Auxiliary.pdf"
    generate_cuas_auxiliary(output)


def cmd_list(args):
    """List available document generators."""
    print("Available document generators:")
    print()
    print("  cuas-auxiliary    CUAS Sandbox 2026 supporting document")
    print()
    print("Use: python -m pdf_generator.cli <generator> -o output.pdf")


def main():
    parser = argparse.ArgumentParser(
        description="Phoenix Rooivalk PDF Generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # cuas-auxiliary command
    cuas_parser = subparsers.add_parser(
        "cuas-auxiliary",
        help="Generate CUAS Sandbox 2026 auxiliary document",
    )
    cuas_parser.add_argument(
        "-o", "--output",
        help="Output file path (default: CUAS_Sandbox_2026_Auxiliary.pdf)",
    )
    cuas_parser.set_defaults(func=cmd_cuas_auxiliary)

    # list command
    list_parser = subparsers.add_parser("list", help="List available generators")
    list_parser.set_defaults(func=cmd_list)

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    args.func(args)


if __name__ == "__main__":
    main()
