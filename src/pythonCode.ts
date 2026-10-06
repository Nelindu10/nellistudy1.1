export const PYTHON_MAIN_CODE = `import os
from datetime import datetime
from bson import ObjectId
from flask import Flask, render_template, request, jsonify, redirect, url_for
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, PyMongoError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# ==============================================================================
# 1. MONGODB ATLAS CONNECTION & COLLECTIONS
# ==============================================================================
# Environment variables: MONGODB_URI & study_quest_db
MONGO_URI = os.getenv("MONGODB_URI", os.getenv("MONGO_URI", "mongodb+srv://dahamithawickramasinghe_db_user:daha2004@cluster0.uiwpse0.mongodb.net/study_quest_db?appName=Cluster0"))
DB_NAME = os.getenv("MONGODB_DB_NAME", os.getenv("DB_NAME", "study_quest_db"))

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=8000)
    client.admin.command('ping')
    print(f"🔮 [MongoDB Atlas] Successfully connected to cluster! Active database: '{DB_NAME}'")
except ConnectionFailure as e:
    print(f"⚠️ [MongoDB Atlas] Warning: Could not connect to cluster: {e}")

db = client[DB_NAME]

# Collections:
# 1. study_topics: Stores topics, star ratings, review history
# 2. disciplines: Stores dynamic subjects / knowledge realms
study_topics = db["study_topics"]
disciplines = db["disciplines"]

# Indexes
try:
    study_topics.create_index([("subject", 1), ("topic", 1)], unique=False)
    disciplines.create_index("name", unique=True)
except Exception:
    pass

# Seed initial disciplines if collection is empty
INITIAL_DISCIPLINES = [
    "Software Engineering",
    "Business Analysis",
    "Data Science & AI",
    "Cybersecurity",
    "Mathematics & Cryptography",
    "Neuroscience & Biology"
]

try:
    if disciplines.count_documents({}) == 0:
        for disc_name in INITIAL_DISCIPLINES:
            disciplines.insert_one({
                "name": disc_name,
                "created_at": datetime.utcnow()
            })
        print("🌱 [Disciplines] Initial realm disciplines seeded.")
except Exception as e:
    print(f"Seeding notice: {e}")


def get_disciplines_list():
    """Helper returning a clean list of discipline dictionaries."""
    try:
        cursor = disciplines.find().sort("name", 1)
        return [{"id": str(d["_id"]), "name": d["name"]} for d in cursor]
    except Exception:
        return [{"id": str(i), "name": name} for i, name in enumerate(INITIAL_DISCIPLINES)]


# ==============================================================================
# 2. DYNAMIC DISCIPLINE CRUD ROUTES
# ==============================================================================
@app.route("/get_disciplines", methods=["GET"])
def get_disciplines():
    """
    AJAX GET:
    Returns JSON list of all active discipline realms from MongoDB.
    """
    data = get_disciplines_list()
    return jsonify({"success": True, "disciplines": data}), 200


@app.route("/add_discipline", methods=["POST"])
def add_discipline():
    """
    AJAX POST:
    Adds a new discipline realm to the disciplines collection.
    Accepts JSON: { "name": "Cloud Architecture" }
    """
    data = request.get_json() if request.is_json else request.form
    name = (data.get("name") or "").strip()

    if not name:
        return jsonify({"success": False, "error": "Discipline name cannot be empty."}), 400

    try:
        # Check if already exists (case-insensitive)
        existing = disciplines.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}})
        if existing:
            return jsonify({
                "success": False,
                "error": f"Discipline realm '{existing['name']}' already exists."
            }), 409

        result = disciplines.insert_one({
            "name": name,
            "created_at": datetime.utcnow()
        })

        return jsonify({
            "success": True,
            "message": f"Realm '{name}' forged successfully!",
            "discipline": {
                "id": str(result.inserted_id),
                "name": name
            }
        }), 201

    except PyMongoError as err:
        return jsonify({"success": False, "error": str(err)}), 500


@app.route("/edit_discipline", methods=["POST"])
def edit_discipline():
    """
    AJAX POST:
    Renames an existing discipline realm.
    Also cascades the update to topics in study_topics with that subject.
    Accepts JSON: { "id": "...", "name": "New Name", "old_name": "Old Name" }
    """
    data = request.get_json() if request.is_json else request.form
    disc_id = data.get("id") or data.get("_id")
    old_name = (data.get("old_name") or "").strip()
    new_name = (data.get("name") or "").strip()

    if not new_name:
        return jsonify({"success": False, "error": "New discipline name cannot be empty."}), 400

    query = {}
    if disc_id:
        try:
            query["_id"] = ObjectId(disc_id)
        except Exception:
            query["_id"] = disc_id
    elif old_name:
        query["name"] = {"$regex": f"^{old_name}$", "$options": "i"}
    else:
        return jsonify({"success": False, "error": "Discipline ID or old name required."}), 400

    try:
        # Find current document to capture original name if not supplied
        current_doc = disciplines.find_one(query)
        if not current_doc:
            return jsonify({"success": False, "error": "Discipline not found."}), 404

        previous_name = current_doc["name"]

        # Update in disciplines collection
        disciplines.update_one(
            {"_id": current_doc["_id"]},
            {"$set": {"name": new_name, "updated_at": datetime.utcnow()}}
        )

        # Cascade update to all topics tagged with the old subject name
        study_topics.update_many(
            {"subject": {"$regex": f"^{previous_name}$", "$options": "i"}},
            {"$set": {"subject": new_name}}
        )

        return jsonify({
            "success": True,
            "message": f"Realm renamed to '{new_name}'. Topics synchronized.",
            "discipline": {
                "id": str(current_doc["_id"]),
                "name": new_name
            }
        }), 200

    except PyMongoError as err:
        return jsonify({"success": False, "error": str(err)}), 500


@app.route("/delete_discipline", methods=["POST", "DELETE"])
def delete_discipline():
    """
    AJAX POST / DELETE:
    Removes a discipline realm from the 'disciplines' collection.
    Accepts JSON body: { "id": "..." } or { "name": "..." }
    Also accepts query params or form-encoded data.
    """
    data = {}
    if request.is_json:
        data = request.get_json(silent=True) or {}
    elif request.form:
        data = request.form.to_dict()
    elif request.args:
        data = request.args.to_dict()

    disc_id = data.get("id") or data.get("_id") or request.args.get("id")
    disc_name = (data.get("name") or request.args.get("name") or "").strip()

    if not disc_id and not disc_name:
        return jsonify({"success": False, "error": "Discipline ID or name required to delete."}), 400

    query = {}
    if disc_id:
        try:
            query["_id"] = ObjectId(disc_id)
        except Exception:
            query["_id"] = disc_id
    elif disc_name:
        query["name"] = {"$regex": f"^{disc_name}$", "$options": "i"}

    try:
        target = disciplines.find_one(query)
        if not target:
            return jsonify({"success": False, "error": "Discipline realm not found."}), 404

        target_name = target["name"]
        target_id_str = str(target["_id"])
        
        # Remove from MongoDB collection
        disciplines.delete_one({"_id": target["_id"]})

        return jsonify({
            "success": True,
            "message": f"Discipline realm '{target_name}' banished from Grimoire.",
            "deleted_id": target_id_str,
            "deleted_name": target_name
        }), 200

    except PyMongoError as err:
        return jsonify({"success": False, "error": str(err)}), 500


# ==============================================================================
# 3. ROUTE: / (Topic Crucible - index.html with Dynamic Disciplines)
# ==============================================================================
@app.route("/")
def index():
    """
    Renders Topic Crucible. Passes dynamic disciplines fetched directly
    from MongoDB collection 'disciplines'.
    """
    try:
        recent_topics = list(
            study_topics.find()
            .sort("created_at", -1)
            .limit(6)
        )
        total_count = study_topics.count_documents({})
    except PyMongoError:
        recent_topics = []
        total_count = 0

    discipline_list = get_disciplines_list()

    return render_template(
        "index.html",
        recent_topics=recent_topics,
        disciplines=discipline_list,
        total_count=total_count
    )


# ==============================================================================
# 4. ROUTE: /check_topic (POST via AJAX)
# ==============================================================================
@app.route("/check_topic", methods=["POST"])
def check_topic():
    data = request.get_json() if request.is_json else request.form
    query_topic = (data.get("topic") or "").strip()
    query_subject = (data.get("subject") or "").strip()

    if not query_topic:
        return jsonify({"exists": False, "message": "Empty query"}), 200

    tier_names = {
        1: "Tier I: Novice",
        2: "Tier II: Apprentice",
        3: "Tier III: Adept",
        4: "Tier IV: Expert",
        5: "Tier V: Archmage"
    }

    try:
        query = {"topic": {"$regex": f"^{query_topic}$", "$options": "i"}}
        if query_subject and query_subject != "All":
            query["subject"] = {"$regex": f"^{query_subject}$", "$options": "i"}

        existing = study_topics.find_one(query)

        if existing:
            rating = int(existing.get("rating", 3))
            subject_found = existing.get("subject", query_subject or "General")
            return jsonify({
                "exists": True,
                "topic": existing.get("topic"),
                "subject": subject_found,
                "rating": rating,
                "tier_name": tier_names.get(rating, f"Tier {rating}"),
                "message": f"Inscribed in [{subject_found}] as {tier_names.get(rating, '')}!"
            }), 200
        else:
            return jsonify({
                "exists": False,
                "topic": query_topic,
                "subject": query_subject,
                "message": f"Uncharted node in [{query_subject or 'General'}]. Ready to forge!"
            }), 200

    except PyMongoError as err:
        return jsonify({"exists": False, "error": str(err)}), 500


# ==============================================================================
# 5. ROUTE: /add_topic (POST)
# ==============================================================================
@app.route("/add_topic", methods=["POST"])
def add_topic():
    data = request.get_json() if request.is_json else request.form
    topic_name = (data.get("topic") or "").strip()
    subject_name = (data.get("subject") or "Software Engineering").strip()
    rating_raw = data.get("rating", 3)

    if not topic_name:
        if request.is_json:
            return jsonify({"success": False, "error": "Topic name cannot be empty."}), 400
        return redirect(url_for("index"))

    try:
        rating = max(1, min(5, int(rating_raw)))
    except (ValueError, TypeError):
        rating = 3

    try:
        study_topics.update_one(
            {
                "topic": {"$regex": f"^{topic_name}$", "$options": "i"},
                "subject": {"$regex": f"^{subject_name}$", "$options": "i"}
            },
            {
                "$set": {
                    "topic": topic_name,
                    "subject": subject_name,
                    "rating": rating,
                    "updated_at": datetime.utcnow()
                },
                "$setOnInsert": {
                    "repetitions": 1,
                    "retention_rate": 60 + (rating * 8),
                    "created_at": datetime.utcnow()
                }
            },
            upsert=True
        )

        if request.is_json:
            return jsonify({
                "success": True,
                "message": f"Node '{topic_name}' forged under [{subject_name}] at Rank {rating}!",
                "topic": {"topic": topic_name, "subject": subject_name, "rating": rating}
            }), 201

        return redirect(url_for("analyze", subject=subject_name))

    except PyMongoError as err:
        if request.is_json:
            return jsonify({"success": False, "error": str(err)}), 500
        return f"Database error: {err}", 500


# ==============================================================================
# 6. ROUTE: /delete_topic (POST via AJAX)
# ==============================================================================
@app.route("/delete_topic", methods=["POST"])
def delete_topic():
    data = request.get_json() if request.is_json else request.form
    topic_id = data.get("id") or data.get("_id")
    topic_name = (data.get("topic") or "").strip()
    subject_name = (data.get("subject") or "").strip()

    if not topic_id and not topic_name:
        return jsonify({"success": False, "error": "Topic ID or name required to banish."}), 400

    query = {}
    if topic_id:
        try:
            query["_id"] = ObjectId(topic_id)
        except Exception:
            query["_id"] = topic_id
    elif topic_name:
        query["topic"] = {"$regex": f"^{topic_name}$", "$options": "i"}
        if subject_name and subject_name != "All":
            query["subject"] = {"$regex": f"^{subject_name}$", "$options": "i"}

    try:
        result = study_topics.delete_one(query)
        if result.deleted_count > 0:
            return jsonify({
                "success": True,
                "message": f"Node '{topic_name or topic_id}' banished from Grimoire.",
                "deleted_count": result.deleted_count
            }), 200
        return jsonify({"success": False, "message": "Node not found."}), 404
    except PyMongoError as err:
        return jsonify({"success": False, "error": str(err)}), 500


# ==============================================================================
# 7. ROUTE: /analyze (Mastery Codex & Analytics)
# ==============================================================================
@app.route("/analyze")
def analyze():
    selected_subject = request.args.get("subject", "All").strip()
    discipline_list = get_disciplines_list()

    query = {}
    if selected_subject and selected_subject != "All":
        query["subject"] = {"$regex": f"^{selected_subject}$", "$options": "i"}

    try:
        all_topics = list(study_topics.find(query).sort("created_at", -1))
    except PyMongoError:
        all_topics = []

    topics_by_star = {5: [], 4: [], 3: [], 2: [], 1: []}
    for item in all_topics:
        try:
            r = max(1, min(5, int(item.get("rating", 3))))
        except (ValueError, TypeError):
            r = 3
        topics_by_star[r].append(item)

    stats = {
        "total": len(all_topics),
        "tier5_count": len(topics_by_star[5]),
        "tier4_count": len(topics_by_star[4]),
        "tier3_count": len(topics_by_star[3]),
        "tier2_count": len(topics_by_star[2]),
        "tier1_count": len(topics_by_star[1]),
        "selected_subject": selected_subject
    }

    return render_template(
        "analyze.html",
        topics_by_star=topics_by_star,
        stats=stats,
        all_topics=all_topics,
        disciplines=discipline_list,
        selected_subject=selected_subject
    )


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug_mode = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1")
    print(f"⚔️ Nelli Study Grimoire running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
`;

export const AJAX_INDEX_SNIPPET = `<!-- ==========================================================================
     index.html: DYNAMIC DISCIPLINE REALM DROPDOWN + "MANAGE REALMS" MODAL
     ========================================================================== -->

<!-- 1. Real-time Dropdown + Manage Button -->
<div class="mb-4 p-4 rounded-2xl bg-surface-container-low border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
  <div class="flex items-center gap-2.5">
    <div class="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
      <span class="material-symbols-outlined text-lg">school</span>
    </div>
    <div>
      <label for="disciplineSelect" class="font-bold text-sm text-primary tracking-wide block">
        Select Discipline Realm:
      </label>
      <span class="text-xs text-on-surface-variant">Populated dynamically from MongoDB collection 'disciplines'.</span>
    </div>
  </div>

  <div class="flex items-center gap-2">
    <!-- Dynamic Dropdown -->
    <select
      id="disciplineSelect"
      class="bg-surface-container text-on-surface font-mono text-xs px-4 py-2.5 rounded-xl border border-primary/40 focus:ring-2 focus:ring-primary cursor-pointer min-w-[200px]"
    >
      {% for d in disciplines %}
      <option value="{{ d.name }}">{{ d.name }}</option>
      {% endfor %}
    </select>

    <!-- Gamified Manage Realms Button -->
    <button
      type="button"
      id="openManageRealmsBtn"
      class="px-3.5 py-2.5 rounded-xl bg-surface-container-high hover:bg-primary hover:text-on-primary text-primary font-mono text-xs font-semibold transition-all flex items-center gap-1.5 border border-primary/40 shadow-sm cursor-pointer whitespace-nowrap"
      title="Manage custom discipline realms"
    >
      <span class="material-symbols-outlined text-sm">settings_suggest</span>
      <span>Manage Realms</span>
    </button>
  </div>
</div>

<!-- 2. Manage Realms Modal Window -->
<div id="manageRealmsModal" class="fixed inset-0 z-50 hidden flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
  <div class="relative w-full max-w-lg bg-surface-container-low rounded-3xl border border-primary/40 shadow-2xl overflow-hidden flex flex-col">
    <!-- Modal Header -->
    <div class="flex items-center justify-between px-6 py-4 bg-surface-container-lowest border-b border-outline-variant/30">
      <div class="flex items-center gap-2.5">
        <span class="material-symbols-outlined text-primary text-xl">account_tree</span>
        <h3 class="font-headline-sm text-lg font-bold text-on-surface">Manage Discipline Realms</h3>
      </div>
      <button type="button" id="closeManageRealmsBtn" class="text-outline hover:text-white p-1 rounded-lg">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>

    <!-- Add New Discipline Form -->
    <div class="p-6 border-b border-outline-variant/20 bg-surface-container/50">
      <label class="block text-xs font-mono text-primary font-semibold uppercase tracking-wider mb-2">
        + Inscribe New Realm
      </label>
      <div class="flex items-center gap-2">
        <input
          type="text"
          id="newDisciplineInput"
          placeholder="e.g. Distributed Systems, Cloud Architecture..."
          class="flex-1 bg-surface-container-lowest text-on-surface font-body-md text-sm px-4 py-2.5 rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary"
        />
        <button
          type="button"
          id="addDisciplineBtn"
          class="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-mono text-xs font-bold hover:brightness-110 transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer"
        >
          <span class="material-symbols-outlined text-sm">add</span> Forge
        </button>
      </div>
      <div id="disciplineError" class="text-xs text-error mt-2 hidden font-mono"></div>
    </div>

    <!-- Existing Disciplines List -->
    <div class="p-6 max-h-[350px] overflow-y-auto">
      <div class="text-xs font-mono text-outline uppercase tracking-wider mb-3">Active Grimoire Realms:</div>
      <div id="disciplinesList" class="flex flex-col gap-2">
        <!-- Populated via AJAX -->
      </div>
    </div>
  </div>
</div>

<!-- ==========================================================================
     3. JAVASCRIPT / AJAX FOR DYNAMIC REALM MANAGEMENT
     ========================================================================== -->
<script>
document.addEventListener("DOMContentLoaded", function () {
  const disciplineSelect = document.getElementById("disciplineSelect");
  const modal = document.getElementById("manageRealmsModal");
  const openBtn = document.getElementById("openManageRealmsBtn");
  const closeBtn = document.getElementById("closeManageRealmsBtn");
  const addBtn = document.getElementById("addDisciplineBtn");
  const input = document.getElementById("newDisciplineInput");
  const list = document.getElementById("disciplinesList");
  const errDiv = document.getElementById("disciplineError");

  // Modal Open / Close
  openBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
    fetchDisciplines();
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Fetch Disciplines from MongoDB (/get_disciplines)
  function fetchDisciplines() {
    fetch("/get_disciplines")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          renderDisciplines(data.disciplines);
          syncDropdown(data.disciplines);
        }
      });
  }

  // Render Disciplines in Modal List
  function renderDisciplines(items) {
    list.innerHTML = "";
    if (items.length === 0) {
      list.innerHTML = '<div class="text-xs text-outline py-4 text-center">No discipline realms found.</div>';
      return;
    }

    items.forEach(d => {
      const itemRow = document.createElement("div");
      itemRow.className = "flex items-center justify-between p-3 rounded-xl bg-surface-container border border-outline-variant/30 hover:border-primary/40 transition-all";
      itemRow.id = \`realm-row-\${d.id}\`;
      itemRow.innerHTML = \`
        <span class="font-mono text-sm text-on-surface font-semibold realm-name">\${d.name}</span>
        <div class="flex items-center gap-1.5">
          <button type="button" class="edit-realm-btn p-1.5 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-primary text-xs transition-colors" title="Rename Realm">
            <span class="material-symbols-outlined text-sm">edit</span>
          </button>
          <button type="button" class="delete-realm-btn p-1.5 rounded-lg bg-error/20 hover:bg-error hover:text-white text-error text-xs transition-colors" title="Banish Realm">
            <span class="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      \`;

      // Edit Event
      itemRow.querySelector(".edit-realm-btn").addEventListener("click", () => {
        const newName = prompt(\`Enter new name for realm "\${d.name}":\`, d.name);
        if (newName && newName.trim() && newName.trim() !== d.name) {
          editDiscipline(d.id, d.name, newName.trim());
        }
      });

      // Delete Event (2-step inline confirm to avoid blocked confirm() dialogs)
      const deleteBtn = itemRow.querySelector(".delete-realm-btn");
      deleteBtn.addEventListener("click", () => {
        if (deleteBtn.dataset.confirming === "true") {
          deleteDiscipline(d.id, d.name, itemRow, deleteBtn);
        } else {
          deleteBtn.dataset.confirming = "true";
          deleteBtn.innerHTML = '<span class="material-symbols-outlined text-xs">warning</span> Confirm?';
          deleteBtn.className = "p-1.5 rounded-lg bg-red-600 text-white text-xs font-bold transition-all shadow-md";

          setTimeout(() => {
            if (deleteBtn && deleteBtn.dataset.confirming === "true") {
              deleteBtn.dataset.confirming = "false";
              deleteBtn.innerHTML = '<span class="material-symbols-outlined text-sm">delete</span>';
              deleteBtn.className = "delete-realm-btn p-1.5 rounded-lg bg-error/20 hover:bg-error hover:text-white text-error text-xs transition-colors";
            }
          }, 4000);
        }
      });

      list.appendChild(itemRow);
    });
  }

  // Synchronize the Main Select Dropdown
  function syncDropdown(items) {
    const currentVal = disciplineSelect.value;
    disciplineSelect.innerHTML = "";
    items.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.name;
      opt.innerText = d.name;
      if (d.name === currentVal) opt.selected = true;
      disciplineSelect.appendChild(opt);
    });
  }

  // Add Discipline via AJAX (/add_discipline)
  addBtn.addEventListener("click", () => {
    const name = input.value.trim();
    if (!name) return;

    errDiv.classList.add("hidden");
    addBtn.disabled = true;

    fetch("/add_discipline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name })
    })
      .then(res => res.json())
      .then(data => {
        addBtn.disabled = false;
        if (data.success) {
          input.value = "";
          fetchDisciplines();
        } else {
          errDiv.innerText = data.error || "Could not add discipline.";
          errDiv.classList.remove("hidden");
        }
      })
      .catch(() => {
        addBtn.disabled = false;
      });
  });

  // Edit Discipline via AJAX (/edit_discipline)
  function editDiscipline(id, oldName, newName) {
    fetch("/edit_discipline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id, old_name: oldName, name: newName })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchDisciplines();
        } else {
          alert("Rename error: " + data.error);
        }
      });
  }

  // Delete Discipline via AJAX (/delete_discipline) with dynamic row removal
  function deleteDiscipline(id, name, rowElement, btn) {
    if (btn) {
      btn.disabled = true;
      btn.innerText = "Banishing...";
    }

    fetch("/delete_discipline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ id: id, name: name })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // 1. Dynamically remove specific row from UI with smooth fade
          const targetRow = rowElement || document.getElementById("realm-row-" + id);
          if (targetRow) {
            targetRow.style.transition = "all 0.3s ease";
            targetRow.style.opacity = "0";
            targetRow.style.transform = "translateX(20px)";
            setTimeout(() => targetRow.remove(), 300);
          }

          // 2. Remove option from dropdown immediately
          if (disciplineSelect) {
            const opt = disciplineSelect.querySelector(\`option[value="\${name}"]\`);
            if (opt) opt.remove();
          }

          // 3. Resync list to keep everything consistent
          fetchDisciplines();
        } else {
          alert("Delete error: " + (data.error || "Could not banish realm."));
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined text-sm">delete</span>';
          }
        }
      })
      .catch(err => {
        console.error("AJAX Error:", err);
        alert("Network error: Could not reach backend.");
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span class="material-symbols-outlined text-sm">delete</span>';
        }
      });
  }

  // ========================================================================
  // 4. TOPIC LIVE CHECK & FORGE LINKED TO SELECTED DISCIPLINE
  // ========================================================================
  const topicInput = document.getElementById("topicInput");
  const topicStatus = document.getElementById("topicStatus");
  const forgeBtn = document.getElementById("forgeTopicBtn");
  let selectedRating = 3;

  // Live AJAX Check Scoped to Selected Discipline (/check_topic)
  if (topicInput && topicStatus) {
    let debounceTimer;
    topicInput.addEventListener("input", function () {
      clearTimeout(debounceTimer);
      const query = topicInput.value.trim();
      const currentSubject = disciplineSelect.value;
      if (query.length < 2) {
        topicStatus.innerText = "";
        return;
      }
      debounceTimer = setTimeout(() => {
        fetch("/check_topic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: query, subject: currentSubject })
        })
          .then(res => res.json())
          .then(data => {
            if (data.exists) {
              topicStatus.innerText = "⚡ " + data.message;
              topicStatus.className = "text-xs font-mono text-amber-400";
            } else {
              topicStatus.innerText = "✨ Uncharted node in [" + currentSubject + "]. Ready to forge!";
              topicStatus.className = "text-xs font-mono text-emerald-400";
            }
          });
      }, 300);
    });
  }

  // Add Topic via AJAX (/add_topic)
  if (forgeBtn && topicInput) {
    forgeBtn.addEventListener("click", function () {
      const topic = topicInput.value.trim();
      const subject = disciplineSelect.value;
      if (!topic) return;

      fetch("/add_topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic,
          subject: subject,
          rating: selectedRating
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert(data.message);
            topicInput.value = "";
            if (topicStatus) topicStatus.innerText = "";
          }
        });
    });
  }
});
</script>
`;

export const JINJA_ANALYZE_SNIPPET = `<!-- ==========================================================================
     analyze.html: DYNAMIC SUBJECT REALM FILTER (from MongoDB collection)
     ========================================================================== -->

<div class="mb-8 p-4 rounded-2xl bg-surface-container-low border border-primary/30 shadow-lg">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
    <div class="flex items-center gap-2">
      <span class="material-symbols-outlined text-primary">account_tree</span>
      <span class="text-sm font-bold uppercase tracking-wider text-primary">Sanctum Disciplines</span>
    </div>

    <!-- Dropdown to Filter Disciplines -->
    <form method="GET" action="/analyze">
      <select 
        name="subject" 
        onchange="this.form.submit()" 
        class="bg-surface-container text-on-surface text-xs font-mono px-3 py-1.5 rounded-lg border border-primary/40 cursor-pointer"
      >
        <option value="All" {% if selected_subject == 'All' %}selected{% endif %}>⚡ All Realms ({{ all_topics|length }} Topics)</option>
        {% for d in disciplines %}
        <option value="{{ d.name }}" {% if selected_subject == d.name %}selected{% endif %}>{{ d.name }}</option>
        {% endfor %}
      </select>
    </form>
  </div>

  <!-- Interactive Subject Tabs -->
  <div class="flex items-center gap-2 overflow-x-auto pb-1">
    <a 
      href="/analyze?subject=All" 
      class="px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all {% if selected_subject == 'All' %}bg-primary text-on-primary shadow-md{% else %}bg-surface-container text-on-surface-variant hover:text-white{% endif %}"
    >
      All Realms ({{ all_topics|length }})
    </a>
    {% for d in disciplines %}
    <a 
      href="/analyze?subject={{ d.name|urlencode }}" 
      class="px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all {% if selected_subject == d.name %}bg-primary text-on-primary shadow-md{% else %}bg-surface-container text-on-surface-variant hover:text-white{% endif %}"
    >
      {{ d.name }}
    </a>
    {% endfor %}
  </div>
</div>
`;

export const REQUIREMENTS_TXT = `# Python requirements.txt
Flask>=3.0.0
pymongo>=4.6.0
python-dotenv>=1.0.0
dnspython>=2.5.0

# Node.js package.json dependencies
# npm install mongodb express dotenv tsx
`;

export const NODE_DB_CONFIG_CODE = `// src/db/mongodb.ts
// MongoDB Atlas Connection Configuration using process.env.MONGODB_URI
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// Reads securely from process.env.MONGODB_URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dahamithawickramasinghe_db_user:daha2004@cluster0.uiwpse0.mongodb.net/study_quest_db?appName=Cluster0';
const DB_NAME = process.env.MONGODB_DB_NAME || 'study_quest_db';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;

export async function connectToDatabase() {
  if (dbInstance && client) {
    return {
      db: dbInstance,
      disciplines: dbInstance.collection('disciplines'),
      studyTopics: dbInstance.collection('study_topics')
    };
  }

  client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
  });

  await client.connect();
  dbInstance = client.db(DB_NAME);
  console.log(\`✅ Connected to MongoDB Atlas (\${DB_NAME})\`);

  return {
    db: dbInstance,
    disciplines: dbInstance.collection('disciplines'),
    studyTopics: dbInstance.collection('study_topics')
  };
}
`;

