"""Validación estructural y de seguridad para los workflows n8n del proyecto."""

import json
import unittest
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS_DIR = PROJECT_ROOT / "src" / "workflows"


class WorkflowValidationTests(unittest.TestCase):
    """Comprueba que los archivos importables mantengan una estructura segura."""

    def setUp(self):
        self.files = sorted(WORKFLOWS_DIR.glob("*.json"))

    def test_expected_workflows_exist(self):
        self.assertEqual(len(self.files), 2, "Deben existir exactamente dos workflows JSON")

    def test_json_and_topology_are_valid(self):
        for path in self.files:
            with self.subTest(workflow=path.name):
                data = json.loads(path.read_text(encoding="utf-8"))
                self.assertIs(data.get("active"), False, "El workflow debe importarse inactivo")
                nodes = data.get("nodes", [])
                self.assertTrue(nodes, "El workflow debe incluir nodos")
                names = [node["name"] for node in nodes]
                self.assertEqual(len(names), len(set(names)), "Los nombres de nodos deben ser únicos")
                known_names = set(names)
                for source, config in data.get("connections", {}).items():
                    self.assertIn(source, known_names, "La conexión debe partir de un nodo existente")
                    for branch in config.get("main", []):
                        for target in branch:
                            self.assertIn(target["node"], known_names, "La conexión debe terminar en un nodo existente")

    def test_prepare_workflow_requires_human_approval(self):
        data = json.loads((WORKFLOWS_DIR / "01_prepare_realistic_content.json").read_text(encoding="utf-8"))
        node_names = {node["name"] for node in data["nodes"]}
        self.assertIn("Create approval packet", node_names)
        self.assertFalse(data["active"])

    def test_publish_workflow_has_explicit_release_gate(self):
        path = WORKFLOWS_DIR / "02_approved_publish_instagram.json"
        content = path.read_text(encoding="utf-8")
        data = json.loads(content)
        node_names = {node["name"] for node in data["nodes"]}
        self.assertIn("Require explicit publish=true", node_names)
        self.assertIn("Safe stop", node_names)
        self.assertIn("publish", content)
        self.assertIn("true", content)
        self.assertFalse(data["active"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
