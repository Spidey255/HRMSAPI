import CompanyRegistration from "../model/CompanyRegister.model.js";
import Organization from "../model/OrganizationModel.js";
import mongoose from "mongoose";

export const insertOrganizationDetails = async (req, res) => {

    const session = await mongoose.startSession();

    session.startTransaction();

    const {
        organizationName,
        industry,
        businessType,
        companyAddress,
        street,
        city,
        state,
        country,
        zipCode,
        phoneNumber,
        faxNumber,
        website,
        fiscal,
        timeZone,
        taxID,
        taxMethod,
        dateFormat,
        companyID
    } = req.body;
    
    const user = req.user;
    const file = req.file;

    let companyLogo = null;

    if(file){
        companyLogo = {
            base64: file.buffer.toString('base64'),
            contentType: file.mimetype,
        };
    }

    if (!user || !user.company) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const company = user.company; 
   
    if (!organizationName || !industry || !businessType || !companyAddress || !street || !city || !state || !zipCode || !phoneNumber || !faxNumber || !website || !fiscal || !timeZone || !taxID) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const existOrganization = await Organization.findOne({ companyID });
        if (existOrganization) {
            return res.status(400).json({ message: 'Organization already exists' });
        }

        const newOrganization = new Organization({
            company,
            organizationName,
            companyLogo,
            industry,
            businessType,
            companyAddress,
            street,
            city,
            state,
            country,
            zipCode,
            phoneNumber,
            faxNumber,
            website,
            fiscal,
            timeZone,
            taxID,
            taxMethod,
            dateFormat,
            companyID
        });

        await newOrganization.validate(); 

        await CompanyRegistration.findByIdAndUpdate(company, { companyProfileStatus: true });

        await newOrganization.save({session});

        await session.commitTransaction();

        session.endSession();
        
        return res.status(201).json({ message: 'Organization details inserted successfully', organization: newOrganization });

    } catch (error) {
        if (error.name === 'ValidationError') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        return res.status(500).json({ error: error.message });
    }
}

export const getOrganizationDetails = async (req, res) => { 
    const user = req.user;
    if (!user || !user.company) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const company = user.company; 

    try {
        const organization = await Organization.findOne({ company });
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }
        const companyLogoBase64 = organization.companyLogo ? organization.companyLogo.base64.toString() : null;

        return res.status(200).json({
            success:true,
            message: 'Organization details retrieved successfully',
            organization: {
                ...organization.toObject(),
                companyLogo:companyLogoBase64
            }
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}