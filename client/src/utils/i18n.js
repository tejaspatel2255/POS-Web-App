import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Sidebar / Navigation
      nav: {
        dashboard: "Dashboard",
        pos: "POS Terminal",
        orders: "Orders Log",
        products: "Products",
        categories: "Categories",
        inventory: "Inventory",
        customers: "Customers",
        reports: "Reports",
        settings: "Settings",
        logout: "Logout",
        admin_mode: "Admin Mode"
      },
      // POS Terminal
      pos: {
        cart: "Current Cart",
        clear: "Clear",
        items_count: "{{count}} items",
        empty_cart: "Your cart is empty. Add products to start billing.",
        subtotal: "Subtotal",
        discount: "Discount",
        tax: "Tax (18%)",
        total: "Total Payable",
        pay_now: "Pay Now",
        complete_sale: "Complete Sale",
        select_customer: "Select Customer",
        walk_in: "Walk-in Customer",
        search_placeholder: "Search products by name, SKU or barcode...",
        all_categories: "All Categories",
        amount_tendered: "Amount Tendered",
        cash_change: "Cash Change",
        payment_method: "Payment Method",
        cash: "Cash",
        card: "Card",
        upi: "UPI",
        insufficient: "Insufficient Amount Paid",
        checkout_title: "Final Checkout & Payment",
        customer_points: "Customer Points",
        earned_points: "Earned Points",
        low_stock_badge: "Low Stock",
        completed_title: "Checkout Completed - Customer Receipt",
        print_receipt: "Print Receipt",
        new_order: "Start New Order"
      },
      // Common UI & Buttons
      common: {
        actions: "Actions",
        view: "View",
        print: "Print",
        edit: "Edit",
        delete: "Delete",
        save: "Save",
        cancel: "Cancel",
        add: "Add New",
        search: "Search...",
        loading: "Loading...",
        no_data: "No records found.",
        success: "Operation successful",
        error: "Something went wrong",
        submit: "Submit",
        export_csv: "Export CSV",
        import_csv: "Import CSV"
      },
      // Dashboard
      dashboard: {
        title: "Business Analytics Dashboard",
        subtitle: "Real-time performance metrics and store insights",
        total_sales: "Total Revenue",
        transactions: "Transactions",
        avg_bill: "Average Bill Value",
        low_stock_alerts: "Critical Low Stock Alerts",
        sales_trend: "Sales Trend",
        recent_orders: "Recent Transactions",
        no_alerts: "All inventory levels are healthy. No alerts.",
        below_min: "items below minimum stock limit"
      },
      // Products
      products: {
        title: "Product Catalog Management",
        add_product: "Add New Product",
        edit_product: "Edit Product",
        name: "Product Name",
        sku: "SKU",
        barcode: "Barcode",
        category: "Category",
        base_price: "Base Price (Selling)",
        cost_price: "Cost Price (Purchase)",
        initial_stock: "Initial Stock",
        min_stock: "Min Stock Alert Level",
        import_title: "Import Products catalog from CSV",
        pasted_csv: "Paste Raw CSV Text Content",
        start_import: "Start CSV Import",
        csv_guideline: "CSV Format Guideline: name,sku,barcode,category_name,base_price,cost_price,initial_stock"
      },
      // Categories
      categories: {
        title: "Category Directory",
        add_category: "Add New Category",
        edit_category: "Edit Category",
        name: "Category Name",
        description: "Description"
      },
      // Inventory
      inventory: {
        title: "Real-time Stock Control",
        add_stock: "Adjust Stock Level",
        product: "Product",
        current_stock: "Current Stock",
        change: "Quantity Change (+ or -)",
        reason: "Reason",
        adjust: "Apply Adjustments",
        logs: "Stock Activity Log",
        type: "Adjustment Type",
        timestamp: "Timestamp"
      },
      // Customers
      customers: {
        title: "Customer Registry & Loyalty",
        add_customer: "Add Customer Profile",
        edit_customer: "Edit Customer",
        name: "Full Name",
        phone: "Mobile Phone Number",
        points: "Loyalty Points",
        history: "Purchase History"
      },
      // Reports
      reports: {
        title: "Financial Reports & Audit Logs",
        sales_tab: "Sales Reports",
        inventory_tab: "Inventory Activity",
        logs_tab: "System Logs",
        generate: "Generate Report",
        total_revenue: "Total Sales Revenue",
        net_profit: "Net Profit",
        sales_count: "Completed Bills"
      },
      // Settings
      settings: {
        title: "Store Settings & Localization",
        shop_name: "Store Name",
        address: "Store Physical Address",
        phone: "Support Phone Number",
        tax_rate: "GST / Tax Rate (%)",
        currency: "Currency Symbol",
        theme: "System Theme Settings",
        lang: "Application Language",
        dark_mode: "Enable Premium Dark Mode Theme"
      }
    }
  },
  hi: {
    translation: {
      nav: {
        dashboard: "डैशबोर्ड",
        pos: "पीओएस टर्मिनल",
        orders: "ऑर्डर सूची",
        products: "उत्पाद",
        categories: "श्रेणियां",
        inventory: "इन्वेंट्री",
        customers: "ग्राहक",
        reports: "रिपोर्ट्स",
        settings: "सेटिंग्स",
        logout: "लॉगआउट",
        admin_mode: "एडमिन मोड"
      },
      pos: {
        cart: "वर्तमान कार्ट",
        clear: "साफ़ करें",
        items_count: "{{count}} उत्पाद",
        empty_cart: "आपकी कार्ट खाली है। बिलिंग शुरू करने के लिए उत्पाद जोड़ें।",
        subtotal: "उप-योग",
        discount: "छूट",
        tax: "कर (18%)",
        total: "कुल देय राशि",
        pay_now: "भुगतान करें",
        complete_sale: "बिक्री पूर्ण करें",
        select_customer: "ग्राहक चुनें",
        walk_in: "सामान्य ग्राहक",
        search_placeholder: "नाम, SKU या बारकोड द्वारा उत्पाद खोजें...",
        all_categories: "सभी श्रेणियां",
        amount_tendered: "प्राप्त राशि",
        cash_change: "बाकी पैसे",
        payment_method: "भुगतान का प्रकार",
        cash: "नकद",
        card: "कार्ड",
        upi: "UPI",
        insufficient: "अपर्याप्त भुगतान राशि",
        checkout_title: "अंतिम चेकआउट और भुगतान",
        customer_points: "ग्राहक अंक",
        earned_points: "अर्जित अंक",
        low_stock_badge: "कम स्टॉक",
        completed_title: "चेकआउट पूर्ण - ग्राहक रसीद",
        print_receipt: "रसीद प्रिंट करें",
        new_order: "नया ऑर्डर शुरू करें"
      },
      common: {
        actions: "कार्रवाई",
        view: "देखें",
        print: "प्रिंट",
        edit: "संपादित करें",
        delete: "हटाएं",
        save: "सहेजें",
        cancel: "रद्द करें",
        add: "नया जोड़ें",
        search: "खोजें...",
        loading: "लोड हो रहा है...",
        no_data: "कोई रिकॉर्ड नहीं मिला।",
        success: "कार्य सफल रहा",
        error: "कुछ गलत हो गया",
        submit: "जमा करें",
        export_csv: "CSV एक्सपोर्ट",
        import_csv: "CSV इम्पोर्ट"
      },
      dashboard: {
        title: "व्यापार विश्लेषण डैशबोर्ड",
        subtitle: "वास्तविक समय प्रदर्शन मेट्रिक्स और स्टोर अंतर्दृष्टि",
        total_sales: "कुल राजस्व",
        transactions: "कुल लेन-देन",
        avg_bill: "औसत बिल मूल्य",
        low_stock_alerts: "महत्वपूर्ण कम स्टॉक अलर्ट",
        sales_trend: "बिक्री का रुझान",
        recent_orders: "हाल के लेन-देन",
        no_alerts: "इन्वेंट्री का स्तर ठीक है। कोई अलर्ट नहीं।",
        below_min: "उत्पाद न्यूनतम स्टॉक सीमा से नीचे हैं"
      },
      products: {
        title: "उत्पाद सूची प्रबंधन",
        add_product: "नया उत्पाद जोड़ें",
        edit_product: "उत्पाद संपादित करें",
        name: "उत्पाद का नाम",
        sku: "SKU",
        barcode: "बारकोड",
        category: "श्रेणी",
        base_price: "विक्रय मूल्य",
        cost_price: "क्रय मूल्य",
        initial_stock: "प्रारंभिक स्टॉक",
        min_stock: "न्यूनतम स्टॉक चेतावनी स्तर",
        import_title: "CSV से उत्पाद आयात करें",
        pasted_csv: "कच्ची CSV सामग्री पेस्ट करें",
        start_import: "आयात शुरू करें",
        csv_guideline: "CSV प्रारूप निर्देश: name,sku,barcode,category_name,base_price,cost_price,initial_stock"
      },
      categories: {
        title: "श्रेणी निर्देशिका",
        add_category: "नयी श्रेणी जोड़ें",
        edit_category: "श्रेणी संपादित करें",
        name: "श्रेणी का नाम",
        description: "विवरण"
      },
      inventory: {
        title: "वास्तविक समय स्टॉक नियंत्रण",
        add_stock: "स्टॉक स्तर समायोजित करें",
        product: "उत्पाद",
        current_stock: "वर्तमान स्टॉक",
        change: "मात्रा परिवर्तन (+ या -)",
        reason: "कारण",
        adjust: "समायोजन लागू करें",
        logs: "स्टॉक गतिविधि लॉग",
        type: "समायोजन का प्रकार",
        timestamp: "समय"
      },
      customers: {
        title: "ग्राहक रजिस्ट्री और वफादारी",
        add_customer: "ग्राहक प्रोफ़ाइल जोड़ें",
        edit_customer: "ग्राहक संपादित करें",
        name: "पूरा नाम",
        phone: "मोबाइल फोन नंबर",
        points: "लॉयल्टी पॉइंट्स",
        history: "खरीद इतिहास"
      },
      reports: {
        title: "वित्तीय रिपोर्ट और ऑडिट लॉग",
        sales_tab: "बिक्री रिपोर्ट",
        inventory_tab: "स्टॉक गतिविधि",
        logs_tab: "सिस्टम लॉग",
        generate: "रिपोर्ट बनाएं",
        total_revenue: "कुल बिक्री राजस्व",
        net_profit: "शुद्ध लाभ",
        sales_count: "पूर्ण बिल"
      },
      settings: {
        title: "स्टोर सेटिंग्स और स्थानीयकरण",
        shop_name: "दुकान का नाम",
        address: "दुकान का पता",
        phone: "सहायता फोन नंबर",
        tax_rate: "GST / टैक्स दर (%)",
        currency: "मुद्रा प्रतीक",
        theme: "सिस्टम थीम सेटिंग्स",
        lang: "एप्लिकेशन भाषा",
        dark_mode: "प्रीमियम डार्क मोड सक्षम करें"
      }
    }
  },
  gu: {
    translation: {
      nav: {
        dashboard: "ડેશબોર્ડ",
        pos: "POS ટર્મિનલ",
        orders: "ઓર્ડર લોગ",
        products: "પ્રોડક્ટ્સ",
        categories: "કેટેગરીઝ",
        inventory: "ઇન્વેન્ટરી",
        customers: "ગ્રાહકો",
        reports: "રિપોર્ટ્સ",
        settings: "સેટિંગ્સ",
        logout: "લોગઆઉટ",
        admin_mode: "એડમિન મોડ"
      },
      pos: {
        cart: "વર્તમાન કાર્ટ",
        clear: "સાફ કરો",
        items_count: "{{count}} આઇટમ્સ",
        empty_cart: "તમારી કાર્ટ ખાલી છે. બિલિંગ શરૂ કરવા માટે પ્રોડક્ટ્સ ઉમેરો.",
        subtotal: "પેટા-ટોટલ",
        discount: "ડિસ્કાઉન્ટ",
        tax: "ટેક્સ (18%)",
        total: "કુલ ચુકવણીપાત્ર",
        pay_now: "ચુકવણી કરો",
        complete_sale: "વેચાણ પૂર્ણ કરો",
        select_customer: "ગ્રાહક પસંદ કરો",
        walk_in: "સામાન્ય ગ્રાહક",
        search_placeholder: "નામ, SKU અથવા બારકોડ દ્વારા પ્રોડક્ટ શોધો...",
        all_categories: "બધી કેટેગરીઝ",
        amount_tendered: "ચૂકવેલ રકમ",
        cash_change: "બાકી રકમ",
        payment_method: "ચુકવણી પદ્ધતિ",
        cash: "રોકડા",
        card: "કાર્ડ",
        upi: "UPI",
        insufficient: "અપૂરતી ચુકવણી રકમ",
        checkout_title: "અંતિમ ચેકઆઉટ અને ચુકવણી",
        customer_points: "ગ્રાહક પોઇન્ટ્સ",
        earned_points: "મેળવેલ પોઇન્ટ્સ",
        low_stock_badge: "ઓછો સ્ટોક",
        completed_title: "ચેકઆઉટ પૂર્ણ - ગ્રાહક રસીદ",
        print_receipt: "રસીદ પ્રિન્ટ કરો",
        new_order: "નવો ઓર્ડર શરૂ કરો"
      },
      common: {
        actions: "ક્રિયાઓ",
        view: "જુઓ",
        print: "પ્રિન્ટ",
        edit: "એડિટ",
        delete: "ડિલીટ",
        save: "સાચવો",
        cancel: "રદ કરો",
        add: "નવું ઉમેરો",
        search: "શોધો...",
        loading: "લોડ થઈ રહ્યું છે...",
        no_data: "કોઈ રેકોર્ડ મળ્યા નથી.",
        success: "ઓપરેશન સફળ રહ્યું",
        error: "કંઈક ખોટું થયું",
        submit: "સબમિટ",
        export_csv: "CSV નિકાસ",
        import_csv: "CSV આયાત"
      },
      dashboard: {
        title: "બિઝનેસ એનાલિટિક્સ ડેશબોર્ડ",
        subtitle: "રીઅલ-ટાઇમ પરફોર્મન્સ મેટ્રિક્સ અને સ્ટોર આંતરદૃષ્ટિ",
        total_sales: "કુલ આવક",
        transactions: "વ્યવહારો",
        avg_bill: "સરેરાશ બિલ મૂલ્ય",
        low_stock_alerts: "મહત્વપૂર્ણ ઓછા સ્ટોકની ચેતવણીઓ",
        sales_trend: "વેચાણ ટ્રેન્ડ",
        recent_orders: "તાજેતરના વ્યવહારો",
        no_alerts: "સ્ટોકનું સ્તર સામાન્ય છે. કોઈ ચેતવણી નથી.",
        below_min: "પ્રોડક્ટ્સ ન્યૂનતમ સ્ટોક મર્યાદાથી નીચે છે"
      },
      products: {
        title: "પ્રોડક્ટ સૂચિ સંચાલન",
        add_product: "નવી પ્રોડક્ટ ઉમેરો",
        edit_product: "પ્રોડક્ટ એડિટ કરો",
        name: "પ્રોડક્ટનું નામ",
        sku: "SKU",
        barcode: "બારકોડ",
        category: "કેટેગરી",
        base_price: "વેચાણ કિંમત",
        cost_price: "ખરીદ કિંમત",
        initial_stock: "પ્રારંભિક સ્ટોક",
        min_stock: "ન્યૂનતમ સ્ટોક ચેતવણી સ્તર",
        import_title: "CSV માંથી પ્રોડક્ટ આયાત કરો",
        pasted_csv: "રો CSV સામગ્રી પેસ્ટ કરો",
        start_import: "આયાત શરૂ કરો",
        csv_guideline: "CSV ફોર્મેટ સૂચના: name,sku,barcode,category_name,base_price,cost_price,initial_stock"
      },
      categories: {
        title: "કેટેગરી ડિરેક્ટરી",
        add_category: "નવી કેટેગરી ઉમેરો",
        edit_category: "કેટેગરી એડિટ કરો",
        name: "કેટેગરીનું નામ",
        description: "વર્ણન"
      },
      inventory: {
        title: "રીઅલ-ટાઇમ સ્ટોક કંટ્રોલ",
        add_stock: "સ્ટોક લેવલ એડજસ્ટ કરો",
        product: "પ્રોડક્ટ",
        current_stock: "વર્તમાન સ્ટોક",
        change: "જથ્થામાં ફેરફાર (+ અથવા -)",
        reason: "કારણ",
        adjust: "એડજસ્ટમેન્ટ લાગુ કરો",
        logs: "સ્ટોક પ્રવૃત્તિ લોગ",
        type: "એડજસ્ટમેન્ટ પ્રકાર",
        timestamp: "સમય"
      },
      customers: {
        title: "ગ્રાહક રજિસ્ટ્રી અને વફાદારી",
        add_customer: "ગ્રાહક પ્રોફાઇલ ઉમેરો",
        edit_customer: "ગ્રાહક એડિટ કરો",
        name: "પૂરું નામ",
        phone: "મોબાઇલ ફોન નંબર",
        points: "લોયલ્ટી પોઇન્ટ્સ",
        history: "ખરીદી ઇતિહાસ"
      },
      reports: {
        title: "નાણાકીય અહેવાલો અને ઓડિટ લોગ",
        sales_tab: "વેચાણ અહેવાલો",
        inventory_tab: "સ્ટોક પ્રવૃત્તિ",
        logs_tab: "સિસ્ટમ લોગ",
        generate: "અહેવાલ બનાવો",
        total_revenue: "કુલ વેચાણ આવક",
        net_profit: "ચોખ્ખો નફો",
        sales_count: "પૂર્ણ થયેલ બિલ"
      },
      settings: {
        title: "સ્ટોર સેટિંગ્સ અને સ્થાનિકીકરણ",
        shop_name: "દુકાનનું નામ",
        address: "દુકાનનું સરનામું",
        phone: "સપોર્ટ ફોન નંબર",
        tax_rate: "GST / ટેક્સ દર (%)",
        currency: "ચલણ પ્રતીક",
        theme: "સિસ્ટમ થીમ સેટિંગ્સ",
        lang: "એપ્લિકેશન ભાષા",
        dark_mode: "પ્રીમિયમ ડાર્ક મોડ સક્ષમ કરો"
      }
    }
  }
};

const savedLang = localStorage.getItem('pos-lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

// Listen to language change to persist it
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('pos-lang', lng);
});

export default i18n;
