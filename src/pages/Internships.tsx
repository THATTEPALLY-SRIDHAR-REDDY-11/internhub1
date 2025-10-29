import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Globe, MapPin, GraduationCap, Plus, Users, Clock, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface InternshipOpportunity {
  id: string;
  title: string;
  description: string;
  url: string;
  logo?: string;
  category: 'global' | 'india' | 'research';
}

const globalInternships: InternshipOpportunity[] = [
  {
    id: '1',
    title: 'Google Summer of Code',
    description: 'Work with open source organizations on coding projects during summer break.',
    url: 'https://summerofcode.withgoogle.com/',
    category: 'global'
  },
  {
    id: '2',
    title: 'Microsoft Internship Program',
    description: 'Software engineering and product management internships at Microsoft.',
    url: 'https://careers.microsoft.com/students/us/en/search-results?keywords=intern',
    category: 'global'
  },
  {
    id: '3',
    title: 'Amazon Internship',
    description: 'Technical and business internships across various Amazon teams.',
    url: 'https://www.amazon.jobs/en/teams/internships-for-students',
    category: 'global'
  },
  {
    id: '4',
    title: 'Meta (Facebook) Internship',
    description: 'Engineering, data science, and product internships at Meta.',
    url: 'https://www.metacareers.com/students/',
    category: 'global'
  },
  {
    id: '5',
    title: 'Apple Internship Program',
    description: 'Hardware and software engineering internships at Apple.',
    url: 'https://jobs.apple.com/en-us/search?team=internships-STDNT-INTRN',
    category: 'global'
  },
  {
    id: '6',
    title: 'LinkedIn Internship',
    description: 'Software engineering and business internships at LinkedIn.',
    url: 'https://careers.linkedin.com/students',
    category: 'global'
  }
];

const indiaInternships: InternshipOpportunity[] = [
  {
    id: '7',
    title: 'Internshala',
    description: 'India\'s largest internship platform with opportunities across all fields.',
    url: 'https://internshala.com/',
    category: 'india'
  },
  {
    id: '8',
    title: 'AICTE Internship Portal',
    description: 'Government-backed internship opportunities for engineering students.',
    url: 'https://internship.aicte-india.org/',
    category: 'india'
  },
  {
    id: '9',
    title: 'TCS iON InfyTQ',
    description: 'Technology internships and training programs by TCS and Infosys.',
    url: 'https://www.tcsion.com/',
    category: 'india'
  },
  {
    id: '10',
    title: 'Naukri Campus',
    description: 'Campus recruitment and internship opportunities for students.',
    url: 'https://www.naukri.com/campus',
    category: 'india'
  },
  {
    id: '11',
    title: 'LetsIntern',
    description: 'Curated internships and skill development programs for students.',
    url: 'https://www.letsintern.com/',
    category: 'india'
  },
  {
    id: '12',
    title: 'Unstop (formerly Dare2Compete)',
    description: 'Competitions, hackathons, and internship opportunities.',
    url: 'https://unstop.com/',
    category: 'india'
  }
];

const researchInternships: InternshipOpportunity[] = [
  {
    id: '13',
    title: 'MITACS Research Internship',
    description: 'Research internships in Canada for international students.',
    url: 'https://www.mitacs.ca/en/programs/globalink',
    category: 'research'
  },
  {
    id: '14',
    title: 'DAAD Research Internships',
    description: 'German Academic Exchange Service research opportunities in Germany.',
    url: 'https://www.daad.de/en/',
    category: 'research'
  },
  {
    id: '15',
    title: 'IIT Research Internships',
    description: 'Summer research fellowships at Indian Institutes of Technology.',
    url: 'https://www.iitb.ac.in/academic/srfp',
    category: 'research'
  },
  {
    id: '16',
    title: 'IISC Summer Fellowship',
    description: 'Research internships at Indian Institute of Science, Bangalore.',
    url: 'https://www.iisc.ac.in/admissions/summer-research-fellowship/',
    category: 'research'
  },
  {
    id: '17',
    title: 'CERN Summer Student Programme',
    description: 'Physics and engineering research at CERN, Switzerland.',
    url: 'https://careers.cern/summer',
    category: 'research'
  },
  {
    id: '18',
    title: 'NASA Internships',
    description: 'Research and engineering internships at NASA centers.',
    url: 'https://www.nasa.gov/learning/students/',
    category: 'research'
  }
];

export default function Internships() {
  const [activeTab, setActiveTab] = useState('global');
  const [userInternships, setUserInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (activeTab === 'community') {
      fetchUserInternships();
    }
  }, [activeTab]);

  const fetchUserInternships = async () => {
    setLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${apiBaseUrl}/internships`);

      if (response.ok) {
        const data = await response.json();
        const activeInternships = data.filter((internship: any) => internship.status === 'active');
        setUserInternships(activeInternships || []);
      }
    } catch (error) {
      console.error('Error fetching user internships:', error);
      setUserInternships([]);
    } finally {
      setLoading(false);
    }
  };

  const renderUserInternshipCards = (internships: any[]) => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {internships.map((internship, idx) => (
        <Card key={internship._id || internship.id || idx} className="border-2 hover:shadow-lg transition-all duration-300 h-full">
          <CardHeader>
            <div className="flex items-start justify-between gap-2 mb-2">
              <CardTitle className="line-clamp-2 flex-1">
                {internship.title}
              </CardTitle>
              {internship.verified && (
                <Badge variant="default" className="bg-green-500">
                  Verified
                </Badge>
              )}
            </div>
            <CardDescription className="font-semibold text-foreground">
              {internship.company_name}
            </CardDescription>
            <CardDescription className="line-clamp-2 mt-2">
              {internship.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(internship.location || internship.remote) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {internship.location && <span>{internship.location}</span>}
                {internship.remote && (
                  <Badge variant="outline" className="ml-auto">
                    Remote
                  </Badge>
                )}
              </div>
            )}
            {internship.duration && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{internship.duration}</span>
              </div>
            )}
            {internship.stipend && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>{internship.stipend}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              {internship.skills?.slice(0, 3).map((skill: string, idx: number) => (
                <Badge key={idx} variant="outline">
                  {skill}
                </Badge>
              ))}
              {internship.skills?.length > 3 && (
                <Badge variant="outline">+{internship.skills.length - 3}</Badge>
              )}
            </div>
            {internship.apply_url && (
              <div className="pt-2 flex justify-end">
                <a href={internship.apply_url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="secondary">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Apply
                  </Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderInternshipCards = (internships: InternshipOpportunity[]) => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {internships.map((internship) => (
        <Card key={internship.id} className="border-2 hover:shadow-lg transition-all duration-300 h-full group">
          <CardHeader>
            <div className="flex items-start justify-between gap-2 mb-2">
              <CardTitle className="line-clamp-2 flex-1 group-hover:text-primary transition-colors">
                {internship.title}
              </CardTitle>
              <div className="flex-shrink-0">
                {internship.category === 'global' && <Globe className="h-5 w-5 text-blue-500" />}
                {internship.category === 'india' && <MapPin className="h-5 w-5 text-orange-500" />}
                {internship.category === 'research' && <GraduationCap className="h-5 w-5 text-purple-500" />}
              </div>
            </div>
            <CardDescription className="line-clamp-3 text-sm">
              {internship.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex justify-end">
              <a
                href={internship.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button size="sm" variant="secondary" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  🔗 Visit
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Internship Board</h1>
            <p className="text-muted-foreground">Discover verified internship opportunities across different platforms</p>
          </div>
          {user && (
            <Link to="/internships/create">
              <Button variant="default" size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Post Internship
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Global 🌍
          </TabsTrigger>
          <TabsTrigger value="india" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            India 🇮🇳
          </TabsTrigger>
          <TabsTrigger value="research" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Research 🧠
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Community 👥
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold mb-2">Global Tech Internships</h2>
            <p className="text-muted-foreground">
              Prestigious internship opportunities at top global technology companies
            </p>
          </div>
          {renderInternshipCards(globalInternships)}
        </TabsContent>

        <TabsContent value="india" className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold mb-2">India-Based Opportunities</h2>
            <p className="text-muted-foreground">
              Local internship platforms and opportunities within India
            </p>
          </div>
          {renderInternshipCards(indiaInternships)}
        </TabsContent>

        <TabsContent value="research" className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold mb-2">Research & Academic Fellowships</h2>
            <p className="text-muted-foreground">
              Research internships and fellowship programs at top institutions
            </p>
          </div>
          {renderInternshipCards(researchInternships)}
        </TabsContent>

        <TabsContent value="community" className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold mb-2">Community Posted Internships</h2>
            <p className="text-muted-foreground">
              Internship opportunities shared by our community members
            </p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-8 w-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading community internships...</p>
              </div>
            </div>
          ) : userInternships.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <h3 className="text-xl font-semibold mb-2">No community internships yet</h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to share an internship opportunity with the community!
                </p>
                {user && (
                  <Link to="/internships/create">
                    <Button variant="default">
                      <Plus className="mr-2 h-4 w-4" />
                      Post First Internship
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            renderUserInternshipCards(userInternships)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
