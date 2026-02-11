// Wait until DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {

    // ===== FIREBASE INIT =====
    const firebaseConfig = {
        apiKey: "AIzaSyA6VBAW6Pw3DMRbjYSwzPS3IkCDfKSj0MI",
        authDomain: "cnhs-enrollment-sys.firebaseapp.com",
        projectId: "cnhs-enrollment-sys",
        storageBucket: "cnhs-enrollment-sys.appspot.com",
        messagingSenderId: "822719734909",
        appId: "1:822719734909:web:efc4b86133dcacdbe2fd14",
        measurementId: "G-9F9KE1SBQX"
    };
    const app = firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();


    // ===== MULTI-STEP FORM VARIABLES =====
    let currentStep = 0;
    let registrationSubmitted = false;
    const steps = document.querySelectorAll(".form-step");
    const MAX_CAPACITY = 50;

    // Initialize first step
    if (steps.length > 0) {
        steps[0].classList.add("active");
    }

    window.nextStep = function(event) {
        if (event) event.preventDefault();
        if (!validateStep(currentStep)) return;

        if (currentStep < steps.length - 1) {
            steps[currentStep].style.opacity = 0;
            steps[currentStep].style.transform = "translateY(20px)";
            setTimeout(() => {
                steps[currentStep].classList.remove("active");
                currentStep++;
                steps[currentStep].classList.add("active");
                steps[currentStep].style.opacity = 1;
                steps[currentStep].style.transform = "translateY(0)";
            }, 300);
        }
    };

    // ===== VALIDATE CURRENT STEP =====
    window.validateStep = function(stepIndex) {
        const step = steps[stepIndex];
        const inputs = step.querySelectorAll("input, select, textarea");
        for (let input of inputs) {
            if ((input.hasAttribute("required") || input.placeholder) && !input.value.trim()) {
                showToast(`⚠️ Please fill in "${input.placeholder || "required fields"}"`);
                return false;
            }
            if (input.type === "email" && input.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value)) {
                    showToast("⚠️ Please enter a valid email address");
                    return false;
                }
            }
        }
        return true;
    };

    // ===== COPY ADMIN EMAIL =====
    window.copyAdminEmail = function() {
        const email = "ADMIN OFFICE";
        navigator.clipboard.writeText(email)
            .then(() => showToast("Admin Name copied!"))
            .catch(() => showToast("Failed to copy email"));
    };

    // ===== SUBMIT REGISTRATION =====
    window.submitRegistration = async function(event) {
        if (event) event.preventDefault();
        if (registrationSubmitted) return showToast("⚠️ Already submitted!");
        if (!validateStep(currentStep)) return;

        const tvlStrand = document.getElementById("tvlStrand").value;
        const acadStrand = document.getElementById("acadStrand").value;

        try {
            const snapshot = await db.collection("registrations").get();
            const registrations = snapshot.docs.map(doc => doc.data());

            let strandCount = { ABM: 0, ICT: 0, "Home Economics": 0, HUMSS: 0 };
            registrations.forEach(s => {
                if (s.acadStrand === "ABM") strandCount.ABM++;
                if (s.tvlStrand === "ICT") strandCount.ICT++;
                if (s.tvlStrand === "Home Economics") strandCount["Home Economics"]++;
                if (s.acadStrand === "HUMSS") strandCount.HUMSS++;
            });

            if (
                (acadStrand === "ABM" && strandCount.ABM >= MAX_CAPACITY) ||
                (tvlStrand === "ICT" && strandCount.ICT >= MAX_CAPACITY) ||
                (tvlStrand === "Home Economics" && strandCount["Home Economics"] >= MAX_CAPACITY) ||
                (acadStrand === "HUMSS" && strandCount.HUMSS >= MAX_CAPACITY)
            ) {
                return showToast("⚠️ Selected strand is full. Please choose another.");
            }

            const data = {
                fullName: document.getElementById("fullName").value,
                age: document.getElementById("age").value,
                birthday: document.getElementById("birthday").value,
                height: document.getElementById("height").value,
                lrn: document.getElementById("lrn").value,
                yearGraduated: document.getElementById("yearGraduated").value,
                studentPhone: document.getElementById("studentPhone").value,
                studentAddress: document.getElementById("studentAddress").value,
                parentName: document.getElementById("parentName").value,
                relationship: document.getElementById("relationship").value,
                parentPhone: document.getElementById("parentPhone").value,
                parentAddress: document.getElementById("parentAddress").value,
                tvlStrand: tvlStrand,
                acadStrand: acadStrand,
                interviewReason: document.getElementById("interviewReason").value,
                student_email: document.getElementById("studentEmail").value,
                timestamp: new Date()
            };

            // ===== SAVE TO FIRESTORE =====
            await db.collection("registrations").add(data);

            // ===== SEND CONFIRMATION EMAIL =====
            const finalStrand = acadStrand || tvlStrand;
            sendConfirmationEmail(
                data.fullName,
                data.student_email,
                finalStrand
            );

            registrationSubmitted = true;
            showToast("✅ Registration submitted! Check your email 📧");
            clearForm();

        } catch (err) {
            console.error("Error saving registration:", err);
            showToast("❌ Failed to submit registration");
        }
    };

    // ===== TOAST NOTIFICATION =====
    function showToast(message) {
        const toast = document.createElement("div");
        toast.textContent = message;
        Object.assign(toast.style, {
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "#0a5ed7",
            color: "#fff",
            padding: "15px 25px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            opacity: "0",
            zIndex: "9999",
            transition: "opacity 0.5s, transform 0.5s"
        });
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = "1"; toast.style.transform = "translateY(0)"; }, 50);
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(20px)";
            setTimeout(() => document.body.removeChild(toast), 500);
        }, 3500);
    }

    // ===== CLEAR FORM =====
    function clearForm() {
        document.querySelectorAll("input, select, textarea").forEach(el => el.value = "");
    }

    window.logoutAdmin = function() {
        showToast("Logged out");
    };
});