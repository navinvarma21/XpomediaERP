"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Container, Table, Spinner, Row, Col, Card, Nav, Tab, Button } from "react-bootstrap"
import { useAuthContext } from "../../../Context/AuthContext"
import { ENDPOINTS } from "../../../SpringBoot/config"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { Link } from "react-router-dom"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { FileSpreadsheet, FileText } from "lucide-react"

const StrengthReport = () => {
  const [activeTab, setActiveTab] = useState("detailed")
  const [loading, setLoading] = useState(true)
  const [strengthData, setStrengthData] = useState({})
  const [sections, setSections] = useState([])
  const [religionCategories, setReligionCategories] = useState([])
  const [communityCategories, setCommunityCategories] = useState([])
  const [totalsByCategory, setTotalsByCategory] = useState({})
  const [grandTotal, setGrandTotal] = useState(0)
  const [summaryData, setSummaryData] = useState({
    religionWise: {},
    communityWise: {},
    genderWise: { Male: 0, Female: 0, Transgender: 0 },
  })

  const { schoolId, currentAcademicYear, getAuthHeaders } = useAuthContext()

  useEffect(() => {
    if (schoolId && currentAcademicYear) {
      fetchAdmissionData()
    }
  }, [schoolId, currentAcademicYear])

  const fetchAdmissionData = async () => {
    try {
      setLoading(true)

      // Fetch all admission records from Spring Boot API
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/studentreport/datas?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.status}`)
      }

      const studentsData = await response.json()

      // Process data to create strength report
      processAdmissionData(studentsData)

      setLoading(false)
    } catch (error) {
      console.error("Error fetching admission data:", error)
      toast.error("Failed to fetch student data")
      setLoading(false)
    }
  }

  const processAdmissionData = (admissionsData) => {
    // Extract unique sections (I-A, I-B, etc.)
    const uniqueSections = new Set()

    // Extract unique religions and communities
    const uniqueReligions = new Set()
    const uniqueCommunities = new Set()

    // Initialize data structure
    const strengthDataObj = {}
    const religionTotals = {}
    const communityTotals = {}
    const genderTotals = { Male: 0, Female: 0, Transgender: 0 }
    let total = 0

    // First pass: identify all unique sections, religions, and communities
    admissionsData.forEach((student) => {
      if (student.standard && student.section) {
        const standardSection = `${student.standard}-${student.section}`
        uniqueSections.add(standardSection)

        const religion = student.religion || "Not Specified"
        uniqueReligions.add(religion)

        const community = student.community || "Not Specified"
        uniqueCommunities.add(community)
      }
    })

    // Convert sets to sorted arrays
    const sortedSections = Array.from(uniqueSections).sort((a, b) => {
      const [standardA, sectionA] = a.split("-")
      const [standardB, sectionB] = b.split("-")

      if (standardA === standardB) {
        return sectionA.localeCompare(sectionB)
      }

      // Use roman numeral comparison for standards
      const romanToNum = (roman) => {
        const romanNumerals = {
          I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12,
          'Grade 1': 1, 'Grade 2': 2, 'Grade 3': 3, 'Grade 4': 4, 'Grade 5': 5, 'Grade 6': 6,
          'Grade 7': 7, 'Grade 8': 8, 'Grade 9': 9, 'Grade 10': 10, 'Grade 11': 11, 'Grade 12': 12
        }
        return romanNumerals[roman] || 0
      }

      return romanToNum(standardA) - romanToNum(standardB)
    })

    const sortedReligions = Array.from(uniqueReligions).sort()
    const sortedCommunities = Array.from(uniqueCommunities).sort()

    // Initialize the data structure with all combinations
    sortedSections.forEach((section) => {
      const [standard, sectionName] = section.split("-")

      if (!strengthDataObj[standard]) {
        strengthDataObj[standard] = {}
      }

      if (!strengthDataObj[standard][sectionName]) {
        strengthDataObj[standard][sectionName] = {
          female: {},
          male: {},
          transgender: {},
          total: {},
        }

        // Initialize all religions and communities with zero
        sortedReligions.forEach((religion) => {
          strengthDataObj[standard][sectionName].female[religion] = {}
          strengthDataObj[standard][sectionName].male[religion] = {}
          strengthDataObj[standard][sectionName].transgender[religion] = {}
          strengthDataObj[standard][sectionName].total[religion] = {}

          sortedCommunities.forEach((community) => {
            strengthDataObj[standard][sectionName].female[religion][community] = 0
            strengthDataObj[standard][sectionName].male[religion][community] = 0
            strengthDataObj[standard][sectionName].transgender[religion][community] = 0
            strengthDataObj[standard][sectionName].total[religion][community] = 0
          })

          // Initialize religion totals
          if (!religionTotals[religion]) {
            religionTotals[religion] = 0
          }
        })

        // Initialize community totals
        sortedCommunities.forEach((community) => {
          if (!communityTotals[community]) {
            communityTotals[community] = 0
          }
        })
      }
    })

    // Second pass: count students by section, gender, religion, and community
    admissionsData.forEach((student) => {
      if (!student.standard || !student.section) return

      const standardSection = `${student.standard}-${student.section}`
      const [standard, sectionName] = standardSection.split("-")

      // Skip if section not found in our structure
      if (!strengthDataObj[standard] || !strengthDataObj[standard][sectionName]) {
        return
      }

      const religion = student.religion || "Not Specified"
      const community = student.community || "Not Specified"
      const gender = student.gender ? student.gender.toLowerCase() : ""

      // Increment counts for all genders including transgender
      if (gender === "female" || gender === "male" || gender === "transgender") {
        strengthDataObj[standard][sectionName][gender][religion][community]++
        strengthDataObj[standard][sectionName].total[religion][community]++

        // Update totals
        religionTotals[religion]++
        communityTotals[community]++
        
        // Handle gender with proper capitalization
        const genderKey = gender.charAt(0).toUpperCase() + gender.slice(1)
        genderTotals[genderKey]++
        total++
      }
    })

    // Calculate row totals for each section, gender, religion, and community
    Object.keys(strengthDataObj).forEach((standard) => {
      Object.keys(strengthDataObj[standard]).forEach((section) => {
        ;["female", "male", "transgender", "total"].forEach((gender) => {
          strengthDataObj[standard][section][gender].Total = {}
          sortedCommunities.forEach((community) => {
            strengthDataObj[standard][section][gender].Total[community] = sortedReligions.reduce(
              (sum, religion) => sum + strengthDataObj[standard][section][gender][religion][community],
              0,
            )
          })
        })
      })
    })

    // Update state
    setSections(sortedSections)
    setReligionCategories([...sortedReligions, "Total"])
    setCommunityCategories(sortedCommunities)
    setStrengthData(strengthDataObj)
    setTotalsByCategory({ religion: religionTotals, community: communityTotals })
    setGrandTotal(total)
    setSummaryData({
      religionWise: religionTotals,
      communityWise: communityTotals,
      genderWise: genderTotals,
    })
  }

  // Calculate standard totals
  const calculateStandardTotals = (standard) => {
    const result = {
      female: {},
      male: {},
      transgender: {},
      total: {},
    }

    // Initialize with zeros for all religions and communities
    religionCategories.forEach((religion) => {
      result.female[religion] = {}
      result.male[religion] = {}
      result.transgender[religion] = {}
      result.total[religion] = {}

      communityCategories.forEach((community) => {
        result.female[religion][community] = 0
        result.male[religion][community] = 0
        result.transgender[religion][community] = 0
        result.total[religion][community] = 0
      })
    })

    // Sum up all sections for this standard
    if (strengthData[standard]) {
      Object.keys(strengthData[standard]).forEach((section) => {
        religionCategories.forEach((religion) => {
          communityCategories.forEach((community) => {
            result.female[religion][community] += strengthData[standard][section].female[religion][community] || 0
            result.male[religion][community] += strengthData[standard][section].male[religion][community] || 0
            result.transgender[religion][community] += strengthData[standard][section].transgender[religion][community] || 0
            result.total[religion][community] += strengthData[standard][section].total[religion][community] || 0
          })
        })
      })
    }

    return result
  }

  // Calculate grand totals across all standards
  const calculateGrandTotals = () => {
    const result = {
      female: {},
      male: {},
      transgender: {},
      total: {},
    }

    // Initialize with zeros for all religions and communities
    religionCategories.forEach((religion) => {
      result.female[religion] = {}
      result.male[religion] = {}
      result.transgender[religion] = {}
      result.total[religion] = {}

      communityCategories.forEach((community) => {
        result.female[religion][community] = 0
        result.male[religion][community] = 0
        result.transgender[religion][community] = 0
        result.total[religion][community] = 0
      })
    })

    // Sum up all standards
    Object.keys(strengthData).forEach((standard) => {
      const standardTotals = calculateStandardTotals(standard)

      religionCategories.forEach((religion) => {
        communityCategories.forEach((community) => {
          result.female[religion][community] += standardTotals.female[religion][community] || 0
          result.male[religion][community] += standardTotals.male[religion][community] || 0
          result.transgender[religion][community] += standardTotals.transgender[religion][community] || 0
          result.total[religion][community] += standardTotals.total[religion][community] || 0
        })
      })
    })

    return result
  }

  // Render table header with religion and community categories
  const renderTableHeader = () => {
    return (
      <tr>
        <th className="text-center">Standard</th>
        <th className="text-center">Section</th>
        <th className="text-center">Gender</th>
        {religionCategories.map((religion) => (
          <th key={religion} colSpan={communityCategories.length} className="text-center">
            {religion}
          </th>
        ))}
      </tr>
    )
  }

  // Render table subheader with community categories
  const renderTableSubheader = () => {
    return (
      <tr>
        <th colSpan={3}></th>
        {religionCategories.map((religion) =>
          communityCategories.map((community) => (
            <th key={`${religion}-${community}`} className="text-center">
              {community}
            </th>
          )),
        )}
      </tr>
    )
  }

  // Render table rows for a specific standard
  const renderStandardRows = (standard) => {
    const sections = Object.keys(strengthData[standard]).sort()
    const rows = []

    sections.forEach((section, sectionIndex) => {
      const sectionData = strengthData[standard][section]
      const genders = ["Female", "Male", "Transgender", "Total"]

      genders.forEach((gender, genderIndex) => {
        rows.push(
          <tr key={`${standard}-${section}-${gender}`}>
            {sectionIndex === 0 && genderIndex === 0 && (
              <td rowSpan={sections.length * 4} className="align-middle text-center">
                {standard}
              </td>
            )}
            {genderIndex === 0 && (
              <td rowSpan={4} className="align-middle text-center">
                {section}
              </td>
            )}
            <td>{gender}</td>
            {religionCategories.map((religion) =>
              communityCategories.map((community) => (
                <td key={`${religion}-${community}`} className="text-center">
                  {sectionData[gender.toLowerCase()][religion][community] || 0}
                </td>
              )),
            )}
          </tr>,
        )
      })
    })

    return rows
  }

  // Render standard total rows
  const renderStandardTotalRow = (standard) => {
    const totals = calculateStandardTotals(standard)

    return (
      <tr className="table-secondary">
        <td colSpan={2} className="text-center fw-bold">
          Total for {standard}
        </td>
        <td className="text-center fw-bold">Total</td>
        {religionCategories.map((religion) =>
          communityCategories.map((community) => (
            <td key={`${religion}-${community}`} className="text-center fw-bold">
              {totals.total[religion][community] || 0}
            </td>
          )),
        )}
      </tr>
    )
  }

  // Render grand total row
  const renderGrandTotalRow = () => {
    const grandTotals = calculateGrandTotals()

    return (
      <tr className="table-dark text-white">
        <td colSpan={2} className="text-center fw-bold">
          Grand Total
        </td>
        <td className="text-center fw-bold">Total</td>
        {religionCategories.map((religion) =>
          communityCategories.map((community) => (
            <td key={`${religion}-${community}`} className="text-center fw-bold">
              {grandTotals.total[religion][community] || 0}
            </td>
          )),
        )}
      </tr>
    )
  }

  // Get total count for summary tables
  const getTotalCount = (dataObj) => {
    return Object.values(dataObj).reduce((sum, count) => sum + count, 0)
  }

  // Render detailed strength report
  const renderDetailedReport = () => {
    return (
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white py-3 d-flex justify-content-between align-items-center">
          <h2 className="mb-0">STRENGTH PARTICULARS</h2>
          <div>
            <Button variant="outline-light" className="me-2" onClick={() => exportToExcel("detailed")}>
              <FileSpreadsheet className="me-2" size={18} />
              Export Excel
            </Button>
            <Button variant="outline-light" onClick={() => exportToPDF("detailed")}>
              <FileText className="me-2" size={18} />
              Export PDF
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-3">Loading strength data...</p>
            </div>
          ) : Object.keys(strengthData).length === 0 ? (
            <div className="text-center py-5">
              <p>No admission data available. Please add students to generate the strength report.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table bordered className="strength-table">
                <thead className="table-light">
                  {renderTableHeader()}
                  {renderTableSubheader()}
                </thead>
                <tbody>
                  {Object.keys(strengthData)
                    .sort()
                    .map((standard) => (
                      <React.Fragment key={standard}>
                        {renderStandardRows(standard)}
                        {renderStandardTotalRow(standard)}
                      </React.Fragment>
                    ))}
                  {renderGrandTotalRow()}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    )
  }

  // Render summary report
  const renderSummaryReport = () => {
    return (
      <Container fluid className="mt-4">
        <Row>
          <Col md={4}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Religion-wise Strength</h5>
                <div>
                  <Button
                    variant="outline-light"
                    size="sm"
                    className="me-2"
                    onClick={() => exportToExcel("summary", "religion")}
                  >
                    <FileSpreadsheet className="me-1" size={14} />
                    Excel
                  </Button>
                  <Button variant="outline-light" size="sm" onClick={() => exportToPDF("summary", "religion")}>
                    <FileText className="me-1" size={14} />
                    PDF
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <Table bordered hover>
                  <thead className="table-light">
                    <tr>
                      <th>Religion</th>
                      <th className="text-center">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(summaryData.religionWise)
                      .sort()
                      .map(([religion, count]) => (
                        <tr key={religion}>
                          <td>{religion}</td>
                          <td className="text-center">{count}</td>
                        </tr>
                      ))}
                    <tr className="table-secondary">
                      <td className="fw-bold">Total</td>
                      <td className="text-center fw-bold">{getTotalCount(summaryData.religionWise)}</td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Community-wise Strength</h5>
                <div>
                  <Button
                    variant="outline-light"
                    size="sm"
                    className="me-2"
                    onClick={() => exportToExcel("summary", "community")}
                  >
                    <FileSpreadsheet className="me-1" size={14} />
                    Excel
                  </Button>
                  <Button variant="outline-light" size="sm" onClick={() => exportToPDF("summary", "community")}>
                    <FileText className="me-1" size={14} />
                    PDF
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <Table bordered hover>
                  <thead className="table-light">
                    <tr>
                      <th>Community</th>
                      <th className="text-center">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(summaryData.communityWise)
                      .sort()
                      .map(([community, count]) => (
                        <tr key={community}>
                          <td>{community}</td>
                          <td className="text-center">{count}</td>
                        </tr>
                      ))}
                    <tr className="table-secondary">
                      <td className="fw-bold">Total</td>
                      <td className="text-center fw-bold">{getTotalCount(summaryData.communityWise)}</td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Gender-wise Strength</h5>
                <div>
                  <Button
                    variant="outline-light"
                    size="sm"
                    className="me-2"
                    onClick={() => exportToExcel("summary", "gender")}
                  >
                    <FileSpreadsheet className="me-1" size={14} />
                    Excel
                  </Button>
                  <Button variant="outline-light" size="sm" onClick={() => exportToPDF("summary", "gender")}>
                    <FileText className="me-1" size={14} />
                    PDF
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <Table bordered hover>
                  <thead className="table-light">
                    <tr>
                      <th>Gender</th>
                      <th className="text-center">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(summaryData.genderWise).map(([gender, count]) => (
                      <tr key={gender}>
                        <td>{gender}</td>
                        <td className="text-center">{count}</td>
                      </tr>
                    ))}
                    <tr className="table-secondary">
                      <td className="fw-bold">Total</td>
                      <td className="text-center fw-bold">{getTotalCount(summaryData.genderWise)}</td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }

  const exportToExcel = (reportType, summaryType = null) => {
    try {
      const workbook = XLSX.utils.book_new()
      let worksheet

      if (reportType === "detailed") {
        // Create worksheet with proper data structure
        const excelData = []

        // Add title
        excelData.push(["STRENGTH PARTICULARS"])
        excelData.push([]) // Empty row

        // Add headers
        const headers = [
          "Standard",
          "Section",
          "Gender",
          ...religionCategories.flatMap((religion) =>
            communityCategories.map((community) => `${religion} - ${community}`)
          ),
        ]
        excelData.push(headers)

        // Add data rows
        Object.entries(strengthData).forEach(([standard, sections]) => {
          Object.entries(sections).forEach(([section, data]) => {
            // Add Female row
            excelData.push([
              standard,
              section,
              "Female",
              ...religionCategories.flatMap((religion) =>
                communityCategories.map((community) => data.female[religion][community] || 0)
              ),
            ])

            // Add Male row
            excelData.push([
              "",
              "",
              "Male",
              ...religionCategories.flatMap((religion) =>
                communityCategories.map((community) => data.male[religion][community] || 0)
              ),
            ])

            // Add Transgender row
            excelData.push([
              "",
              "",
              "Transgender",
              ...religionCategories.flatMap((religion) =>
                communityCategories.map((community) => data.transgender[religion][community] || 0)
              ),
            ])

            // Add Section Total row
            excelData.push([
              "",
              "",
              "Total",
              ...religionCategories.flatMap((religion) =>
                communityCategories.map((community) => data.total[religion][community] || 0)
              ),
            ])

            excelData.push([]) // Empty row between sections
          })

          // Add standard total
          const standardTotals = calculateStandardTotals(standard)
          excelData.push([
            `Total for ${standard}`,
            "",
            "Total",
            ...religionCategories.flatMap((religion) =>
              communityCategories.map((community) => standardTotals.total[religion][community] || 0)
            ),
          ])
          excelData.push([]) // Empty row after standard total
        })

        // Add grand total
        const grandTotals = calculateGrandTotals()
        excelData.push([
          "Grand Total",
          "",
          "Total",
          ...religionCategories.flatMap((religion) =>
            communityCategories.map((community) => grandTotals.total[religion][community] || 0)
          ),
        ])

        // Create worksheet from the data array
        worksheet = XLSX.utils.aoa_to_sheet(excelData)

        // Set column widths
        const colWidths = [
          { wch: 15 }, // Standard
          { wch: 10 }, // Section
          { wch: 12 }, // Gender
          ...Array(religionCategories.length * communityCategories.length).fill({ wch: 8 }), // Data columns
        ]
        worksheet['!cols'] = colWidths

        XLSX.utils.book_append_sheet(workbook, worksheet, "Detailed Strength Report")
      } else if (reportType === "summary") {
        let data
        let title
        let columnName

        switch (summaryType) {
          case "religion":
            data = Object.entries(summaryData.religionWise)
            title = "Religion-wise Strength"
            columnName = "Religion"
            break
          case "community":
            data = Object.entries(summaryData.communityWise)
            title = "Community-wise Strength"
            columnName = "Community"
            break
          case "gender":
            data = Object.entries(summaryData.genderWise)
            title = "Gender-wise Strength"
            columnName = "Gender"
            break
          default:
            throw new Error("Invalid summary type")
        }

        const excelData = [
          [title],
          [],
          [columnName, "Count"],
          ...data.sort(),
          ["Total", getTotalCount(summaryData[`${summaryType}Wise`])]
        ]

        worksheet = XLSX.utils.aoa_to_sheet(excelData)
        
        // Set column widths for summary
        worksheet['!cols'] = [
          { wch: 20 },
          { wch: 10 }
        ]

        XLSX.utils.book_append_sheet(workbook, worksheet, `${title} Summary`)
      }

      XLSX.writeFile(workbook, `StrengthReport_${reportType}_${summaryType || ""}.xlsx`)
      toast.success("Excel report generated successfully")
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      toast.error("Failed to generate Excel report")
    }
  }

  const exportToPDF = (reportType, summaryType = null) => {
    try {
      const doc = new jsPDF({
        orientation: reportType === "detailed" ? "landscape" : "portrait",
        unit: "mm",
        format: reportType === "detailed" ? "a3" : "a4",
      })

      if (reportType === "detailed") {
        // Set up the table data
        const tableHead = [
          [
            "Standard",
            "Section",
            "Gender",
            ...religionCategories.flatMap((religion) =>
              communityCategories.map((community) => `${religion} - ${community}`),
            ),
          ],
        ]
        const tableBody = []

        Object.entries(strengthData)
          .sort()
          .forEach(([standard, sections]) => {
            Object.entries(sections)
              .sort()
              .forEach(([section, data]) => {
                // Add Female row
                tableBody.push([
                  standard,
                  section,
                  "Female",
                  ...religionCategories.flatMap((religion) =>
                    communityCategories.map((community) => data.female[religion][community] || 0),
                  ),
                ])

                // Add Male row
                tableBody.push([
                  "",
                  "",
                  "Male",
                  ...religionCategories.flatMap((religion) =>
                    communityCategories.map((community) => data.male[religion][community] || 0),
                  ),
                ])

                // Add Transgender row
                tableBody.push([
                  "",
                  "",
                  "Transgender",
                  ...religionCategories.flatMap((religion) =>
                    communityCategories.map((community) => data.transgender[religion][community] || 0),
                  ),
                ])

                // Add Section Total row
                tableBody.push([
                  "",
                  "",
                  "Total",
                  ...religionCategories.flatMap((religion) =>
                    communityCategories.map((community) => data.total[religion][community] || 0),
                  ),
                ])
              })

            // Add Standard Total row
            const standardTotals = calculateStandardTotals(standard)
            tableBody.push([
              `Total for ${standard}`,
              "",
              "Total",
              ...religionCategories.flatMap((religion) =>
                communityCategories.map((community) => standardTotals.total[religion][community] || 0),
              ),
            ])
          })

        // Add Grand Total row
        const grandTotals = calculateGrandTotals()
        tableBody.push([
          "Grand Total",
          "",
          "Total",
          ...religionCategories.flatMap((religion) =>
            communityCategories.map((community) => grandTotals.total[religion][community] || 0),
          ),
        ])

        // Title
        doc.setFontSize(16)
        doc.setTextColor(11, 61, 123)
        doc.text("STRENGTH PARTICULARS", 14, 10)

        // Create table
        autoTable(doc, {
          startY: 20,
          head: tableHead,
          body: tableBody,
          theme: "grid",
          styles: {
            fontSize: 6,
            cellPadding: 1,
            overflow: "linebreak",
            halign: "center",
          },
          headStyles: {
            fillColor: [11, 61, 123],
            textColor: 255,
            fontSize: 6,
            fontStyle: "bold",
            halign: "center",
          },
          columnStyles: {
            0: { cellWidth: 15 }, // Standard
            1: { cellWidth: 12 }, // Section
            2: { cellWidth: 15 }, // Gender
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          didParseCell: (data) => {
            // Add bold style to total rows
            if (data.row.raw[0]?.startsWith("Total") || data.row.raw[0] === "Grand Total") {
              data.cell.styles.fontStyle = "bold"
              data.cell.styles.fillColor = [240, 240, 240]
            }
            if (data.row.raw[0] === "Grand Total") {
              data.cell.styles.fillColor = [11, 61, 123]
              data.cell.styles.textColor = 255
            }
          },
        })

        doc.save("DetailedStrengthReport.pdf")
        toast.success("PDF report generated successfully")
      } else if (reportType === "summary") {
        let data
        let title

        switch (summaryType) {
          case "religion":
            data = Object.entries(summaryData.religionWise)
            title = "Religion-wise Strength"
            break
          case "community":
            data = Object.entries(summaryData.communityWise)
            title = "Community-wise Strength"
            break
          case "gender":
            data = Object.entries(summaryData.genderWise)
            title = "Gender-wise Strength"
            break
          default:
            throw new Error("Invalid summary type")
        }

        // Title
        doc.setFontSize(16)
        doc.setTextColor(11, 61, 123)
        doc.text(title, 14, 20)

        // Create table
        autoTable(doc, {
          startY: 30,
          head: [[summaryType === "gender" ? "Gender" : summaryType, "Count"]],
          body: [...data.sort(), ["Total", getTotalCount(summaryData[`${summaryType}Wise`])]],
          theme: "grid",
          styles: {
            fontSize: 10,
            cellPadding: 5,
            overflow: "linebreak",
            halign: "left",
          },
          headStyles: {
            fillColor: [11, 61, 123],
            textColor: 255,
            fontSize: 12,
            fontStyle: "bold",
            halign: "center",
          },
          columnStyles: {
            1: { halign: "center" },
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          didParseCell: (data) => {
            if (data.row.index === data.table.body.length - 1) {
              data.cell.styles.fontStyle = "bold"
              data.cell.styles.fillColor = [240, 240, 240]
            }
          },
        })

        doc.save(`${title}Summary.pdf`)
        toast.success("PDF report generated successfully")
      }
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      toast.error("Failed to generate PDF report")
    }
  }

  if (!schoolId) {
    return (
      <MainContentPage>
        <Container fluid className="px-0">
          <div className="text-center py-4">
            <h4>School ID not available. Please login again.</h4>
          </div>
        </Container>
      </MainContentPage>
    )
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        {/* Breadcrumb Navigation */}
        <div className="mb-4">
          <nav className="custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <Link to="/reports">Reports</Link>
            <span className="separator mx-2">&gt;</span>
            <span>Strength Report</span>
          </nav>
        </div>

        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Nav variant="tabs" className="mb-4">
            <Nav.Item>
              <Nav.Link eventKey="detailed" className="px-4">
                Detailed Strength Report
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="summary" className="px-4">
                Summary Report
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            <Tab.Pane eventKey="detailed">{renderDetailedReport()}</Tab.Pane>
            <Tab.Pane eventKey="summary">{renderSummaryReport()}</Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Container>

      <style>
        {`
          .custom-breadcrumb {
            padding: 0.5rem 1rem;
          }

          .custom-breadcrumb a {
            color: #0B3D7B;
            text-decoration: none;
          }

          .custom-breadcrumb .separator {
            margin: 0 0.5rem;
            color: #6c757d;
          }

          .nav-tabs .nav-link {
            color: #495057;
            border: 1px solid transparent;
            border-top-left-radius: 0.25rem;
            border-top-right-radius: 0.25rem;
          }

          .nav-tabs .nav-link.active {
            color: #0B3D7B;
            background-color: #fff;
            border-color: #dee2e6 #dee2e6 #fff;
            font-weight: 600;
          }

          .strength-table {
            font-size: 0.9rem;
          }

          .strength-table th, .strength-table td {
            vertical-align: middle;
            padding: 0.5rem;
          }

          .strength-table thead th {
            background-color: #f8f9fa;
            font-weight: 600;
          }

          @media (max-width: 992px) {
            .strength-table {
              font-size: 0.8rem;
            }

            .strength-table th, .strength-table td {
              padding: 0.3rem;
            }
          }

          .text-primary {
            color: #0B3D7B !important;
          }

          .text-secondary {
            color: #6c757d !important;
          }
        `}
      </style>
      <ToastContainer />
    </MainContentPage>
  )
}

export default StrengthReport