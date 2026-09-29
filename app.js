const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

// Sebaiknya simpan key di environment variable, bukan di kode
const API_KEY = process.env.MAPTILER_KEY || "vsyevmiIS3fA3qzAAaaV";

app.use(express.static(path.join(__dirname, "public")));

// Ambil teks dari context berdasarkan jenis wilayah (country, region, dst.)
function cari(feature, jenis) {
    if (feature.place_type && jenis.some((j) => feature.place_type.includes(j))) {
        return feature.text;
    }
    const ctx = (feature.context || []).find((c) =>
        jenis.some((j) => c.id.startsWith(j + "."))
    );
    return ctx ? ctx.text : null;
}

app.get("/api/lokasi", async (req, res) => {
    const kota = (req.query.q || "").trim();

    if (!kota) {
        return res.status(400).json({ message: "Isi nama lokasi terlebih dahulu" });
    }

    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(kota)}.json`;

    try {
        const response = await axios.get(url, {
            params: { key: API_KEY, language: "id", limit: 1 },
        });

        const feature = response.data.features[0];

        if (!feature) {
            return res.status(404).json({ message: `Lokasi "${kota}" tidak ditemukan` });
        }

        const [longitude, latitude] = feature.geometry.coordinates;

        res.json({
            nama: feature.place_name || feature.text,
            negara: cari(feature, ["country"]),
            provinsi: cari(feature, ["region"]),
            kecamatan: cari(feature, ["county", "joint_municipality", "subregion", "municipality"]),
            longitude,
            latitude,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Gagal mengambil data dari MapTiler" });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});